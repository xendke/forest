"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AuthFormProps {
  mode: "join" | "login"
}

const REGISTER = `
  mutation($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user { id email }
    }
  }
`

const LOGIN = `
  mutation($email: String!, $password: String!, $rememberMe: Boolean) {
    login(email: $email, password: $password, rememberMe: $rememberMe) {
      token
      user { id email }
    }
  }
`

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isJoin = mode === "join"
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const query = isJoin ? REGISTER : LOGIN
      const variables = isJoin ? { email, password } : { email, password, rememberMe }

      const res = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      })

      const json = await res.json()
      if (json.errors?.length) throw new Error(json.errors[0].message)

      const payload = json.data.register ?? json.data.login
      const store = rememberMe ? localStorage : sessionStorage
      store.setItem("forest_token", payload.token)

      window.location.href = isJoin ? "/onboarding" : "/home"
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder={isJoin ? "Min. 8 characters" : "Your password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={isJoin ? 8 : undefined}
          autoComplete={isJoin ? "new-password" : "current-password"}
        />
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 rounded accent-primary cursor-pointer"
        />
        <label
          htmlFor="rememberMe"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          Remember me
        </label>
      </div>

      <Button
        type="submit"
        className="w-full rounded-full"
        size="lg"
        disabled={loading}
      >
        {loading ? "Please wait…" : isJoin ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isJoin ? "Already have an account? " : "Don't have an account? "}
        <Link
          href={isJoin ? "/login" : "/join"}
          className="text-primary hover:text-primary/80 transition-colors font-medium"
        >
          {isJoin ? "Sign in" : "Join now"}
        </Link>
      </p>
    </form>
  )
}
