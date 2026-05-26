import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getServerToken } from "@/lib/auth"
import { serverGql } from "@/lib/api.server"
import { Navbar } from "@/components/Navbar"
import { GoalsPage } from "@/components/GoalsPage"
import type { Goal, GoalSuggestion } from "@/types/goals"

export const metadata: Metadata = {
  title: "Goals — Forest",
}

const GOALS_QUERY = `query {
  me { firstName }
  goals {
    id title description category emoji frequency source
    completedToday currentStreak totalCompletions createdAt
  }
  goalSuggestions {
    title description category emoji frequency isRecommended
  }
}`

type GoalsData = {
  me: { firstName: string | null } | null
  goals: Goal[]
  goalSuggestions: GoalSuggestion[]
}

export default async function GoalsRoute() {
  if (!getServerToken()) redirect("/")

  let me: { firstName: string | null } | null = null
  let goals: Goal[] = []
  let suggestions: GoalSuggestion[] = []

  try {
    const data = await serverGql<GoalsData>(GOALS_QUERY)
    me          = data.me
    goals       = data.goals            ?? []
    suggestions = data.goalSuggestions  ?? []
  } catch (err) {
    console.error("[goals/page] Failed to load data:", err)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(900px 600px at 12% -10%, rgba(34,192,106,0.18), transparent 60%),
          radial-gradient(1200px 700px at 110% 10%, rgba(34,192,106,0.10), transparent 55%),
          radial-gradient(800px 500px at 50% 110%, rgba(34,192,106,0.08), transparent 60%),
          #050807
        `,
      }}
    >
      <Navbar variant="app" firstName={me?.firstName} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-7 pb-20">
        <div className="mt-[42px] mb-[26px]">
          <h1 className="text-[34px] font-bold tracking-[-0.03em] leading-tight">Goals</h1>
          <p
            className="mt-2 text-[14.5px] leading-[1.55] max-w-[440px]"
            style={{ color: "rgba(154,168,160,1)" }}
          >
            Build the habits that support your mental growth.
          </p>
        </div>

        <GoalsPage initialGoals={goals} suggestions={suggestions} />
      </main>
    </div>
  )
}
