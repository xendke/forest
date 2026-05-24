import bcrypt from 'bcrypt'
import type { MercuriusContext } from 'mercurius'
import { prisma } from './prisma'
import { signToken, verifyToken } from './auth'

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
