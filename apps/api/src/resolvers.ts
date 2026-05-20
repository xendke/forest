import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import { signToken, verifyToken } from './auth'

const SALT_ROUNDS = 12

type Context = { authHeader?: string }

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

export const resolvers = {
  Query: {
    hello: async () => 'Hello from Forest API!',
    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.authHeader?.startsWith('Bearer ')) return null
      const payload = verifyToken(context.authHeader.slice(7))
      if (!payload) return null
      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      return user ? serializeUser(user) : null
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
      {
        email,
        password,
        rememberMe,
      }: { email: string; password: string; rememberMe?: boolean }
    ) => {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) throw new Error('Invalid email or password')

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) throw new Error('Invalid email or password')

      const token = signToken(user.id, rememberMe)
      return { token, user: serializeUser(user) }
    },
  },
}
