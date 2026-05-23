import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getServerToken } from "@/lib/auth"
import { serverGql } from "@/lib/api.server"
import { QuizModal } from "@/components/QuizModal"
import type { DailyQuiz } from "@/types/quiz"

export const metadata: Metadata = {
  title: "Home — Forest",
}

const TODAY_QUIZ_QUERY = `query {
  todayQuiz {
    id completed skipped
    questions { id text category type options }
    responses { questionId answer skipped }
  }
}`

export default async function HomePage() {
  if (!getServerToken()) redirect("/")

  let initialQuiz: DailyQuiz | null = null
  try {
    const data = await serverGql<{ todayQuiz: DailyQuiz | null }>(TODAY_QUIZ_QUERY)
    initialQuiz = data.todayQuiz
  } catch {
    // Quiz fetch failed — modal will stay hidden
  }

  return (
    <>
      <QuizModal initialQuiz={initialQuiz} />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 40%, hsl(138 50% 8% / 0.8) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div
              className="w-3 h-3 rounded-full bg-primary"
              style={{ boxShadow: "0 0 20px 5px hsl(142 65% 55% / 0.4)" }}
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              You&apos;re in.{" "}
              <span className="text-primary">Welcome.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Your dashboard is on its way. You&apos;re at the starting line.
            </p>
          </div>

          <Link
            href="/logout"
            className="inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out →
          </Link>
        </div>
      </div>
    </>
  )
}
