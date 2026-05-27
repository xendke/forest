import bcrypt from 'bcrypt'
import type { MercuriusContext } from 'mercurius'
import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { signToken, verifyToken } from './auth'
import { generateInsights, PLACEHOLDER_INSIGHTS, type InsightItem } from './ai'

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

function getUserContext(context: MercuriusContext): { userId: number; isDemo: boolean } | null {
  if (!context.authHeader?.startsWith('Bearer ')) return null
  const payload = verifyToken(context.authHeader.slice(7))
  if (!payload) return null
  return { userId: payload.userId, isDemo: payload.isDemo ?? false }
}

function todayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── goal helpers ───────────────────────────────────────────────────────────

const GOAL_LIBRARY = [
  { title: "Morning meditation",      description: "Start your day with 5 minutes of quiet focus",         category: "Mindfulness", emoji: "🧘", frequency: "daily" },
  { title: "Box breathing",           description: "4-4-4-4 breath cycle to ease anxiety",                 category: "Mindfulness", emoji: "🌬️", frequency: "daily" },
  { title: "Gratitude journaling",    description: "Write 3 things you're grateful for today",             category: "Mindfulness", emoji: "✍️", frequency: "daily" },
  { title: "Digital detox hour",      description: "One screen-free hour before bed",                      category: "Mindfulness", emoji: "📵", frequency: "daily" },
  { title: "Morning sunlight",        description: "Get outside within an hour of waking",                 category: "Mood",        emoji: "☀️", frequency: "daily" },
  { title: "Time in nature",          description: "Spend time outside in a natural setting",              category: "Mood",        emoji: "🌿", frequency: "daily" },
  { title: "Act of kindness",         description: "Do something thoughtful for another person",           category: "Mood",        emoji: "😊", frequency: "daily" },
  { title: "Creative activity",       description: "15+ minutes of any creative pursuit",                  category: "Mood",        emoji: "🎨", frequency: "daily" },
  { title: "Phone-free focus session",description: "25 minutes of deep work, no distractions",            category: "Focus",       emoji: "🎯", frequency: "daily" },
  { title: "Read for 15 minutes",     description: "Build a daily reading habit",                          category: "Focus",       emoji: "📚", frequency: "daily" },
  { title: "Plan tomorrow",           description: "5 minutes planning your next day before bed",          category: "Focus",       emoji: "📋", frequency: "daily" },
  { title: "Tackle one priority task",description: "Complete your most important task first",              category: "Focus",       emoji: "✅", frequency: "daily" },
  { title: "No social media before 10am", description: "Protect your morning mental clarity",             category: "Focus",       emoji: "🚫", frequency: "daily" },
  { title: "Drink 8 glasses of water",description: "Stay consistently hydrated",                          category: "Body",        emoji: "💧", frequency: "daily" },
  { title: "30 minutes of movement",  description: "Any form of physical activity counts",                 category: "Body",        emoji: "🏃", frequency: "daily" },
  { title: "Evening walk",            description: "Wind down with a gentle walk after dinner",            category: "Body",        emoji: "🚶", frequency: "daily" },
  { title: "In bed by 10:30pm",       description: "Anchor your sleep schedule",                           category: "Sleep",       emoji: "😴", frequency: "daily" },
  { title: "No screens before bed",   description: "30 minute wind-down without devices",                  category: "Sleep",       emoji: "🌙", frequency: "daily" },
  { title: "Connect with a friend",   description: "Call or message someone you care about",              category: "Social",      emoji: "📞", frequency: "daily" },
  { title: "Share how you feel",      description: "Open up to someone you trust",                        category: "Social",      emoji: "💬", frequency: "daily" },
]

function getPrevDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}

function computeGoalStreak(completionDates: string[], today: string): number {
  const dateSet = new Set(completionDates)
  const start = dateSet.has(today) ? today : getPrevDay(today)
  if (!dateSet.has(start)) return 0
  let streak = 0
  let cur = start
  while (dateSet.has(cur)) {
    streak++
    cur = getPrevDay(cur)
  }
  return streak
}

function serializeGoal(
  goal: {
    id: number; title: string; description: string | null; category: string; emoji: string
    frequency: string; source: string; createdAt: Date; completions: { date: string }[]
  },
  today: string
) {
  const dates = goal.completions.map((c) => c.date)
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    emoji: goal.emoji,
    frequency: goal.frequency,
    source: goal.source,
    completedToday: dates.includes(today),
    currentStreak: computeGoalStreak(dates, today),
    totalCompletions: dates.length,
    createdAt: goal.createdAt.toISOString(),
  }
}

// ── ai insights shared logic ───────────────────────────────────────────────

async function fetchAndCacheInsights(
  userId: number,
  cached: Awaited<ReturnType<typeof prisma.aiInsight.findUnique>>
) {
  const placeholder = { items: PLACEHOLDER_INSIGHTS, generatedAt: null, isExample: true }

  try {
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

    if (quizzes.length < 5) {
      await prisma.aiInsight.upsert({
        where: { userId },
        update: { insights: PLACEHOLDER_INSIGHTS as unknown as Prisma.InputJsonArray, isExample: true, generatedAt: new Date() },
        create: { userId, insights: PLACEHOLDER_INSIGHTS as unknown as Prisma.InputJsonArray, isExample: true },
      })
      return { items: PLACEHOLDER_INSIGHTS, generatedAt: new Date().toISOString(), isExample: true }
    }

    const getScale = (quiz: typeof quizzes[0], category: string) => {
      const q = quiz.questions.find((q) => q.category === category)
      if (!q) return null
      const r = quiz.responses.find((r) => r.questionId === q.id)
      return r?.answer != null ? parseFloat(r.answer) : null
    }

    const quizData = quizzes
      .map((quiz) => ({
        date: quiz.date,
        mood: getScale(quiz, 'Mood'),
        anxiety: getScale(quiz, 'Anxiety'),
        focus: getScale(quiz, 'Focus'),
      }))
      .filter((d): d is { date: string; mood: number; anxiety: number; focus: number } =>
        d.mood !== null
      )

    const journalData = journalEntries.map((e) => ({
      date: e.createdAt.toISOString().split('T')[0],
      content: e.content,
    }))

    let insights: InsightItem[] = PLACEHOLDER_INSIGHTS
    let isExample = true
    try {
      insights = await generateInsights(quizData, journalData)
      isExample = false
    } catch (err) {
      console.error('[aiInsights] Claude generation failed:', err)
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
      update: { insights: insights as unknown as Prisma.InputJsonArray, isExample, generatedAt: now },
      create: { userId, insights: insights as unknown as Prisma.InputJsonArray, isExample },
    })

    return { items: insights, generatedAt: now.toISOString(), isExample }
  } catch (err) {
    console.error('[aiInsights] Failed to fetch/process data:', err)
    return placeholder
  }
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

      const placeholder = { items: PLACEHOLDER_INSIGHTS, generatedAt: null, isExample: true }

      // Check cache first — guard DB access so a missing table returns gracefully
      let cached: Awaited<ReturnType<typeof prisma.aiInsight.findUnique>>
      try {
        cached = await prisma.aiInsight.findUnique({ where: { userId } })
      } catch (err) {
        console.error('[aiInsights] DB lookup failed (migration may not have run yet):', err)
        return placeholder
      }

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

      return fetchAndCacheInsights(userId, cached)
    },

    goals: async (_: unknown, __: unknown, context: MercuriusContext) => {
      const userId = getUserId(context)
      if (!userId) return []
      const today = todayUTC()
      const goals = await prisma.goal.findMany({
        where: { userId, isActive: true },
        include: { completions: { orderBy: { date: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      })
      return goals.map((g) => serializeGoal(g, today))
    },

    goalSuggestions: async (_: unknown, __: unknown, context: MercuriusContext) => {
      const userId = getUserId(context)
      if (!userId) return GOAL_LIBRARY.map((g) => ({ ...g, isRecommended: false }))

      const [activeGoals, insight] = await Promise.all([
        prisma.goal.findMany({ where: { userId, isActive: true }, select: { title: true } }),
        prisma.aiInsight.findUnique({ where: { userId } }),
      ])

      const activeTitles = new Set(activeGoals.map((g) => g.title.toLowerCase()))

      const recommendedCategories = new Set<string>()
      if (insight && !insight.isExample) {
        const items = insight.insights as unknown as { type: string; insight: string }[]
        for (const item of items) {
          if (item.type !== 'warning') continue
          const t = item.insight.toLowerCase()
          if (/anxi|stress|overwhelm|nervous/.test(t)) recommendedCategories.add('Mindfulness')
          if (/mood|low|sad|energy|depress/.test(t))   { recommendedCategories.add('Mood'); recommendedCategories.add('Body') }
          if (/focus|distract|concentrat|productiv/.test(t)) recommendedCategories.add('Focus')
          if (/sleep|tired|fatigue|rest/.test(t))       recommendedCategories.add('Sleep')
          if (/isolat|social|connect|lonely/.test(t))   recommendedCategories.add('Social')
        }
      }

      return GOAL_LIBRARY
        .filter((g) => !activeTitles.has(g.title.toLowerCase()))
        .map((g) => ({ ...g, isRecommended: recommendedCategories.has(g.category) }))
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

      const token = signToken(user.id, rememberMe, user.isDemo)
      return { token, user: serializeUser(user) }
    },

    demoLogin: async () => {
      const user = await prisma.user.findFirst({ where: { isDemo: true } })
      if (!user) throw new Error('Demo account not configured')
      const token = signToken(user.id, true, true)
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

      const quiz = await prisma.dailyQuiz.findUnique({
        where: { id: quizId },
        include: { questions: { orderBy: { id: 'asc' } }, responses: true },
      })
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
      const ctx = getUserContext(context)
      if (!ctx) throw new Error('Unauthorized')
      const { userId, isDemo } = ctx

      if (isDemo) {
        const now = new Date().toISOString()
        return { id: 0, userId, content, createdAt: now, updatedAt: now }
      }
      const entry = await prisma.journalEntry.create({ data: { userId, content } })
      return { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() }
    },

    updateJournalEntry: async (
      _: unknown,
      { id, content }: { id: number; content: string },
      context: MercuriusContext
    ) => {
      const ctx = getUserContext(context)
      if (!ctx) throw new Error('Unauthorized')
      const { userId, isDemo } = ctx

      if (isDemo) {
        const now = new Date().toISOString()
        return { id, userId, content, createdAt: now, updatedAt: now }
      }
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
      const ctx = getUserContext(context)
      if (!ctx) throw new Error('Unauthorized')
      const { userId, isDemo } = ctx

      if (isDemo) return true
      const entry = await prisma.journalEntry.findUnique({ where: { id } })
      if (!entry || entry.userId !== userId) throw new Error('Entry not found')
      await prisma.journalEntry.delete({ where: { id } })
      return true
    },

    refreshInsights: async (_: unknown, __: unknown, context: MercuriusContext) => {
      const ctx = getUserContext(context)
      if (!ctx) throw new Error('Unauthorized')
      const { userId, isDemo } = ctx

      const cached = await prisma.aiInsight.findUnique({ where: { userId } })

      if (isDemo && cached) {
        return {
          items: cached.insights,
          generatedAt: cached.generatedAt.toISOString(),
          isExample: cached.isExample,
        }
      }

      if (!isDemo) {
        await prisma.aiInsight.deleteMany({ where: { userId } })
      }
      return fetchAndCacheInsights(userId, null)
    },

    createGoal: async (
      _: unknown,
      args: { title: string; description?: string; category: string; emoji: string; frequency?: string; source?: string },
      context: MercuriusContext
    ) => {
      const ctx = getUserContext(context)
      if (!ctx) throw new Error('Unauthorized')
      const { userId, isDemo } = ctx

      if (isDemo) {
        return {
          id: -(Date.now() % 100000),
          title: args.title,
          description: args.description ?? null,
          category: args.category,
          emoji: args.emoji,
          frequency: args.frequency ?? 'daily',
          source: args.source ?? 'manual',
          completedToday: false,
          currentStreak: 0,
          totalCompletions: 0,
          createdAt: new Date().toISOString(),
        }
      }

      const today = todayUTC()
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: args.title,
          description: args.description ?? null,
          category: args.category,
          emoji: args.emoji,
          frequency: args.frequency ?? 'daily',
          source: args.source ?? 'manual',
        },
        include: { completions: true },
      })
      return serializeGoal(goal, today)
    },

    toggleGoalCompletion: async (
      _: unknown,
      { goalId, date }: { goalId: number; date: string },
      context: MercuriusContext
    ) => {
      const ctx = getUserContext(context)
      if (!ctx) throw new Error('Unauthorized')
      const { userId, isDemo } = ctx
      const today = todayUTC()

      if (isDemo) {
        return {
          id: goalId,
          title: '', description: null, category: '', emoji: '',
          frequency: 'daily', source: 'manual',
          completedToday: true, currentStreak: 1, totalCompletions: 1,
          createdAt: new Date().toISOString(),
        }
      }

      const goal = await prisma.goal.findUnique({ where: { id: goalId } })
      if (!goal || goal.userId !== userId) throw new Error('Goal not found')

      const existing = await prisma.goalCompletion.findUnique({
        where: { goalId_date: { goalId, date } },
      })
      if (existing) {
        await prisma.goalCompletion.delete({ where: { id: existing.id } })
      } else {
        await prisma.goalCompletion.create({ data: { goalId, date } })
      }

      const updated = await prisma.goal.findUnique({
        where: { id: goalId },
        include: { completions: { orderBy: { date: 'asc' } } },
      })
      return serializeGoal(updated!, today)
    },

    archiveGoal: async (
      _: unknown,
      { goalId }: { goalId: number },
      context: MercuriusContext
    ) => {
      const ctx = getUserContext(context)
      if (!ctx) throw new Error('Unauthorized')
      const { userId, isDemo } = ctx

      if (isDemo) return true

      const goal = await prisma.goal.findUnique({ where: { id: goalId } })
      if (!goal || goal.userId !== userId) throw new Error('Goal not found')
      await prisma.goal.update({ where: { id: goalId }, data: { isActive: false } })
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

      // Keep existing responses so the modal can pre-fill previous answers
      return prisma.dailyQuiz.update({
        where: { id: quizId },
        data: { completed: false, skipped: false },
        include: { questions: { orderBy: { id: 'asc' } }, responses: true },
      })
    },
  },
}
