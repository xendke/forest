"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const UPDATE_PROFILE = `
  mutation($firstName: String, $dob: String) {
    updateProfile(firstName: $firstName, dob: $dob) {
      id
      email
      firstName
    }
  }
`

function getToken() {
  return (
    localStorage.getItem("forest_token") ??
    sessionStorage.getItem("forest_token")
  )
}

export function OnboardingForm() {
  const [firstName, setFirstName] = useState("")
  const [dob, setDob] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = getToken()
      if (!token) { router.replace("/login"); return }

      const variables: Record<string, string> = {}
      if (firstName.trim()) variables.firstName = firstName.trim()
      if (dob) variables.dob = dob

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
      const res = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: UPDATE_PROFILE, variables }),
      })

      const json = await res.json()
      if (json.errors?.length) throw new Error(json.errors[0].message)

      router.push("/home")
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
        <label className="text-sm text-muted-foreground" htmlFor="firstName">
          First name <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <Input
          id="firstName"
          type="text"
          placeholder="Your first name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground" htmlFor="dob">
          Date of birth <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <Input
          id="dob"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="[color-scheme:dark]"
        />
      </div>

      <div className="space-y-3 pt-1">
        <Button
          type="submit"
          className="w-full rounded-full"
          size="lg"
          disabled={loading}
        >
          {loading ? "Saving…" : "Continue →"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/home")}
        >
          Skip for now
        </Button>
      </div>
    </form>
  )
}
