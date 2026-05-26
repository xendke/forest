import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export function signToken(userId: number, rememberMe = false, isDemo = false): string {
  return jwt.sign({ userId, isDemo }, JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '1d',
  })
}

export function verifyToken(token: string): { userId: number; isDemo?: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; isDemo?: boolean }
  } catch {
    return null
  }
}
