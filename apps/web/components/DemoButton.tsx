"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const DEMO_LOGIN = `mutation { demoLogin { token } }`

export function DemoButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDemo() {
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
      const res = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: DEMO_LOGIN }),
      })
      const json = await res.json()
      if (json.errors?.length) throw new Error(json.errors[0].message)

      const token: string = json.data.demoLogin.token
      const secure = location.protocol === "https:"
      document.cookie = [
        `forest_token=${encodeURIComponent(token)}`,
        "path=/",
        "SameSite=Lax",
        `Max-Age=${30 * 24 * 60 * 60}`,
        ...(secure ? ["Secure"] : []),
      ].join("; ")

      router.push("/home")
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDemo}
      disabled={loading}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      {loading ? "Loading…" : "Demo"}
    </button>
  )
}
