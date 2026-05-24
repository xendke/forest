import bcrypt from 'bcrypt'
import type { MercuriusContext } from 'mercurius'
import { prisma } from './prisma'
import { signToken, verifyToken } from './auth'
import { generateInsights, PLACEHOLDER_INSIGHTS } from './ai'

declare module 'mercurius' {
  interface MercuriusContext {
    authHeader?: string
  }
}

const SALT_ROUNDS = 12

// ── helpers ────────────────────────────────────────────────────────────────

function serializeUser(user: {
  id: number
  email: string
  firstName: string | null
  createdAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    createdAt: user.createdAt.toISOString(),
  }
}

function getUserId(context: MercuriusContext): number | null {
  if (!context.authHeader?.startsWith('Bearer ')) return null
  const payload = verifyToken(context.authHeader.slice(7))
  return payload?.userId ?? null
}

function todayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── resolvers ──────────────────────────────────────────────────────────────

export const resolvers = {
  Query: {
    hello: async () => 'Hello from Forest API!',

    me: async (_: unknown, __: unknown, context: MercuriusContext) => {
      const userId = getUserId(context)
      if (!userId) return null
      const user = await prisma.user.findUnique({ where: { id: userId } })
      return user ? serializeUser(user) : null
    },

    quizHistory: async (
      _: unknown,
      { days = 30 }: { days?: number },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) return []

      // Build oldest-first date array for the requested window
      const dates: string[] = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - i)
        dates.push(d.toISOString().split('T')[0])
      }

      const quizzes = await prisma.dailyQuiz.findMany({
        where: { userId, date: { in: dates }, completed: true, skipped: false },
        include: {
          questions: { where: { type: 'scale', isQuick: true } },
          responses: true,
        },
      })

      const byDate = new Map(quizzes.map((q) => [q.date, q]))

      return dates.map((date) => {
        const quiz = byDate.get(date)
        if (!quiz) return { date, wellbeing: null, mood: null, calm: null, focus: null }

        const getScale = (category: string): number | null => {
          const q = quiz.questions.find((q) => q.category === category)
          if (!q) return null
          const r = quiz.responses.find((r) => r.questionId === q.id)
          return r?.answer != null ? parseFloat(r.answer) : null
        }

        const mood    = getScale('Mood')
        const anxiety = getScale('Anxiety')
        const focus   = getScale('Focus')
        const calm    = anxiety != null ? 6 - anxiety : null

        const wellbeing =
          mood != null && calm != null && focus != null
            ? Math.round(((mood / 5) + (calm / 5) + (focus / 5)) / 3 * 1000) / 10
            : null

        return { date, wellbeing, mood, calm, focus }
      })
    },

    streakInfo: async (_: unknown, __: unknown, context: MercuriusContext) => {
      const userId = getUserId(context)
      if (!userId) return { current: 0, best: 0, last7: [] }

      const today = todayUTC()

      const quizzes = await prisma.dailyQuiz.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true, completed: true, skipped: true },
      })

      const byDate = new Map(quizzes.map((q) => [q.date, q]))

      // Current streak: walk backward from today
      const todayQuiz = byDate.get(today)
      const todayDone = !!(todayQuiz?.completed && !todayQuiz?.skipped)
      let current = 0
      for (let i = todayDone ? 0 : 1; i < 365; i++) {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const q = byDate.get(dateStr)
        if (!q || !q.completed || q.skipped) break
        current++
      }

      // Best streak: longest consecutive completed run in full history
      const completedDates = quizzes
        .filter((q) => q.completed && !q.skipped)
        .map((q) => q.date) // already sorted asc

      let best = completedDates.length > 0 ? 1 : 0
      let run  = completedDates.length > 0 ? 1 : 0
      for (let i = 1; i < completedDates.length; i++) {
        const diff = Math.round(
          (new Date(completedDates[i] + 'T00:00:00Z').getTime() -
            new Date(completedDates[i - 1] + 'T00:00:00Z').getTime()) / 86400000
        )
        if (diff === 1) {
          run++
          if (run > best) best = run
        } else {
          run = 1
        }
      }
      best = Math.max(best, current)

      // Last 7 days status (oldest first)
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - (6 - i))
        const dateStr = d.toISOString().split('T')[0]
        const q = byDate.get(dateStr)
        const status =
          dateStr === today ? 'today'
          : !q              ? 'missed'
          : q.completed && !q.skipped ? 'completed'
          : 'skipped'
        return { date: dateStr, status }
      })

      return { current, best, last7 }
    },

    journalEntries: async (
      _: unknown,
      { limit = 100, offset = 0 }: { limit?: number; offset?: number },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) return []
      const entries = await prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
      return entries.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }))
    },

    aiInsights: async (_: unknown, __: unknown, context: MercuriusContext) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')

      // Return cached insights if they are less than 24 hours old
      const cached = await prisma.aiInsight.findUnique({ where: { userId } })
      if (cached) {
        const ageHours = (Date.now() - cached.generatedAt.getTime()) / 3_600_000
        if (ageHours < 24) {
          return {
            items: cached.insights,
            generatedAt: cached.generatedAt.toISOString(),
            isExample: cached.isExample,
          }
        }
      }

      // Gather the last 30 days of completed quiz data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
      const sinceDate = thirtyDaysAgo.toISOString().split('T')[0]

      const [quizzes, journalEntries] = await Promise.all([
        prisma.dailyQuiz.findMany({
          where: { userId, completed: true, skipped: false, date: { gte: sinceDate } },
          include: {
            questions: { where: { type: 'scale', isQuick: true } },
            responses: true,
          },
          orderBy: { date: 'asc' },
        }),
        prisma.journalEntry.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: { createdAt: true, content: true },
        }),
      ])

      // Not enough data — return placeholder without calling Claude
      const MIN_ENTRIES = 5
      if (quizzes.length < MIN_ENTRIES) {
        await prisma.aiInsight.upsert({
          where: { userId },
          update: { insights: PLACEHOLDER_INSIGHTS, isExample: true, generatedAt: new Date() },
          create: { userId, insights: PLACEHOLDER_INSIGHTS, isExample: true },
        })
        return { items: PLACEHOLDER_INSIGHTS, generatedAt: new Date().toISOString(), isExample: true }
      }

      // Build compact quiz score array for the prompt
      const getScale = (quiz: typeof quizzes[0], category: string) => {
        const q = quiz.questions.find((q) => q.category === category)
        if (!q) return null
        const r = quiz.responses.find((r) => r.questionId === q.id)
        return r?.answer != null ? parseFloat(r.answer) : null
      }

      const quizData = quizzes.map((quiz) => ({
        date: quiz.date,
        mood: getScale(quiz, 'Mood'),
        anxiety: getScale(quiz, 'Anxiety'),
        focus: getScale(quiz, 'Focus'),
      })).filter((d) => d.mood !== null)

      const journalData = journalEntries.map((e) => ({
        date: e.createdAt.toISOString().split('T')[0],
        content: e.content,
      }))

      // Call Claude; fall back to placeholder if anything goes wrong
      let insights = PLACEHOLDER_INSIGHTS
      let isExample = true
      try {
        insights = await generateInsights(
          quizData as Array<{ date: string; mood: number; anxiety: number; focus: number }>,
          journalData
        )
        isExample = false
      } catch (err) {
        console.error('AI insights generation failed:', err)
        // Use stale cached data if available, otherwise placeholder
        if (cached) {
          return {
            items: cached.insights,
            generatedAt: cached.generatedAt.toISOString(),
            isExample: cached.isExample,
          }
        }
      }

      const now = new Date()
      await prisma.aiInsight.upsert({
        where: { userId },
        update: { insights, isExample, generatedAt: now },
        create: { userId, insights, isExample },
      })

      return { items: insights, generatedAt: now.toISOString(), isExample }
    },

    todayQuiz: async (_: unknown, __: unknown, context: MercuriusContext) => {
      const userId = getUserId(context)
      if (!userId) return null

      const date = todayUTC()

      // Return existing quiz if already created today
      const existing = await prisma.dailyQuiz.findUnique({
        where: { userId_date: { userId, date } },
        include: { questions: { orderBy: { id: 'asc' } }, responses: true },
      })
      if (existing) return existing

      // Select questions for a new quiz
      const [quickQuestions, openEndedQuestions] = await Promise.all([
        prisma.question.findMany({ where: { isQuick: true }, orderBy: { id: 'asc' } }),
        prisma.question.findMany({ where: { isQuick: false }, orderBy: { id: 'asc' } }),
      ])

      // Find open-ended questions used in the last 7 days to avoid repeats
      const pastDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - i - 1)
        return d.toISOString().split('T')[0]
      })

      const recentQuizzes = await prisma.dailyQuiz.findMany({
        where: { userId, date: { in: pastDates } },
        include: { questions: { where: { isQuick: false }, select: { id: true } } },
      })

      const recentIds = new Set(recentQuizzes.flatMap((q) => q.questions.map((q) => q.id)))
      const freshPool = openEndedQuestions.filter((q) => !recentIds.has(q.id))
      const pool = freshPool.length >= 2 ? freshPool : openEndedQuestions
      const selectedOpen = shuffle(pool).slice(0, 2)

      const quiz = await prisma.dailyQuiz.create({
        data: {
          userId,
          date,
          questions: {
            connect: [...quickQuestions, ...selectedOpen].map((q) => ({ id: q.id })),
          },
        },
        include: { questions: { orderBy: { id: 'asc' } }, responses: true },
      })

      return quiz
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) throw new Error('An account with that email already exists')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')

      const hashed = await bcrypt.hash(password, SALT_ROUNDS)
      const user = await prisma.user.create({ data: { email, password: hashed } })
      const token = signToken(user.id)
      return { token, user: serializeUser(user) }
    },

    login: async (
      _: unknown,
      { email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean }
    ) => {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) throw new Error('Invalid email or password')

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) throw new Error('Invalid email or password')

      const token = signToken(user.id, rememberMe)
      return { token, user: serializeUser(user) }
    },

    updateProfile: async (
      _: unknown,
      { firstName, dob }: { firstName?: string; dob?: string },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(dob !== undefined ? { dob: new Date(dob) } : {}),
        },
      })
      return serializeUser(user)
    },

    submitQuizResponse: async (
      _: unknown,
      {
        quizId,
        questionId,
        answer,
        skipped,
      }: { quizId: number; questionId: number; answer?: string; skipped?: boolean },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')

      // Verify the quiz belongs to this user
      const quiz = await prisma.dailyQuiz.findUnique({ where: { id: quizId } })
      if (!quiz || quiz.userId !== userId) throw new Error('Quiz not found')

      return prisma.quizResponse.upsert({
        where: { quizId_questionId: { quizId, questionId } },
        update: { answer: answer ?? null, skipped: skipped ?? false },
        create: { quizId, questionId, answer: answer ?? null, skipped: skipped ?? false },
      })
    },

    completeQuiz: async (
      _: unknown,
      { quizId, skipped }: { quizId: number; skipped?: boolean },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')

      const quiz = await prisma.dailyQuiz.findUnique({ where: { id: quizId } })
      if (!quiz || quiz.userId !== userId) throw new Error('Quiz not found')

      return prisma.dailyQuiz.update({
        where: { id: quizId },
        data: { completed: true, skipped: skipped ?? false },
        include: { questions: { orderBy: { id: 'asc' } }, responses: true },
      })
    },

    createJournalEntry: async (
      _: unknown,
      { content }: { content: string },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')
      const entry = await prisma.journalEntry.create({ data: { userId, content } })
      return { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() }
    },

    updateJournalEntry: async (
      _: unknown,
      { id, content }: { id: number; content: string },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')
      const entry = await prisma.journalEntry.findUnique({ where: { id } })
      if (!entry || entry.userId !== userId) throw new Error('Entry not found')
      const updated = await prisma.journalEntry.update({ where: { id }, data: { content } })
      return { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() }
    },

    deleteJournalEntry: async (
      _: unknown,
      { id }: { id: number },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')
      const entry = await prisma.journalEntry.findUnique({ where: { id } })
      if (!entry || entry.userId !== userId) throw new Error('Entry not found')
      await prisma.journalEntry.delete({ where: { id } })
      return true
    },

    reopenQuiz: async (
      _: unknown,
      { quizId }: { quizId: number },
      context: MercuriusContext
    ) => {
      const userId = getUserId(context)
      if (!userId) throw new Error('Unauthorized')

      const quiz = await prisma.dailyQuiz.findUnique({ where: { id: quizId } })
      if (!quiz || quiz.userId !== userId) throw new Error('Quiz not found')

      await prisma.quizResponse.deleteMany({ where: { quizId } })

      return prisma.dailyQuiz.update({
        where: { id: quizId },
        data: { skipped: false, completed: false },
        include: { questions: { orderBy: { id: 'asc' } }, responses: true },
      })
    },
  },
}
