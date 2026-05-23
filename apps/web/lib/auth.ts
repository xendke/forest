import { cookies } from 'next/headers'

export function getServerToken(): string | null {
  return cookies().get('forest_token')?.value ?? null
}
