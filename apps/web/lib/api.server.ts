import { getServerToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function serverGql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = getServerToken()
  const label = query.trim().slice(0, 80).replace(/\s+/g, ' ')

  let res: Response
  try {
    res = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    })
  } catch (err) {
    console.error(`[serverGql] Network error — could not reach API at ${API_URL}`, err)
    throw err
  }

  if (!res.ok) {
    console.error(`[serverGql] HTTP ${res.status} ${res.statusText} for: ${label}`)
    throw new Error(`GraphQL HTTP error: ${res.status}`)
  }

  let json: { data?: T; errors?: Array<{ message: string; path?: unknown[] }> }
  try {
    json = await res.json()
  } catch (err) {
    console.error(`[serverGql] Failed to parse JSON response for: ${label}`, err)
    throw err
  }

  // Log every field-level error so they appear in Vercel Function logs
  if (json.errors?.length) {
    for (const e of json.errors) {
      const path = e.path ? ` (at ${(e.path as string[]).join('.')})` : ''
      console.error(`[serverGql] GraphQL error${path}: ${e.message}`)
    }
    // Only throw if there is no data at all — partial data is still usable
    if (!json.data) {
      throw new Error(json.errors[0].message)
    }
  }

  return json.data as T
}
