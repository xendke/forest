function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('forest_token') ?? sessionStorage.getItem('forest_token')
}

export async function gql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = getToken()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

  const res = await fetch(`${apiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}
