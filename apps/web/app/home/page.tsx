import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getServerToken } from "@/lib/auth"
import { serverGql } from "@/lib/api.server"
import { QuizModal } from "@/components/QuizModal"
import { Navbar } from "@/components/Navbar"
import { WellbeingCard } from "@/components/WellbeingCard"
import { CheckInCard } from "@/components/CheckInCard"
import { StreakCard } from "@/components/StreakCard"
import type { DailyQuiz, QuizHistoryEntry, StreakInfo } from "@/types/quiz"

export const metadata: Metadata = {
  title: "Home — Forest",
}

const HOME_QUERY = `query {
  me { firstName }
  todayQuiz {
    id completed skipped
    questions { id text category type options }
    responses { questionId answer skipped }
  }
  quizHistory(days: 30) { date wellbeing mood calm focus }
  streakInfo { current best last7 { date status } }
}`

type HomeData = {
  me: { firstName: string | null } | null
  todayQuiz: DailyQuiz | null
  quizHistory: QuizHistoryEntry[]
  streakInfo: StreakInfo
}

const DEFAULT_STREAK: StreakInfo = { current: 0, best: 0, last7: [] }

function getGreeting() {
  const hour = new Date().getUTCHours()
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 17) return "Good afternoon"
  if (hour >= 17 && hour < 22) return "Good evening"
  return "Good night"
}

function getFormattedDate() {
  const now = new Date()
  const day  = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
  const date = now.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  })
  return { day, date }
}

export default async function HomePage() {
  if (!getServerToken()) redirect("/")

  let me: { firstName: string | null } | null = null
  let initialQuiz: DailyQuiz | null = null
  let history: QuizHistoryEntry[] = []
  let streak: StreakInfo = DEFAULT_STREAK

  try {
    const data = await serverGql<HomeData>(HOME_QUERY)
    me           = data.me
    initialQuiz  = data.todayQuiz
    history      = data.quizHistory   ?? []
    streak       = data.streakInfo    ?? DEFAULT_STREAK
  } catch {
    // Fetch failed — render with empty state
  }

  const greeting  = getGreeting()
  const firstName = me?.firstName
  const { day, date } = getFormattedDate()

  return (
    <>
      <QuizModal initialQuiz={initialQuiz} />

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
        <Navbar variant="app" firstName={firstName} />

        <main className="max-w-[1280px] mx-auto px-4 sm:px-7 pb-20">
          {/* Greeting */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mt-[42px] mb-[26px] gap-4">
            <div>
              <h1 className="text-[34px] font-bold tracking-[-0.03em] leading-tight">
                {greeting},{" "}
                <em className="not-italic" style={{ color: "#3ee07f" }}>
                  {firstName ?? "there"}
                </em>
                .
              </h1>
              <p
                className="mt-2 text-[14.5px] leading-[1.55] max-w-[520px]"
                style={{ color: "rgba(154,168,160,1)" }}
              >
                {initialQuiz?.completed
                  ? "Check-in complete for today. See you again tomorrow."
                  : initialQuiz?.skipped
                  ? "You skipped today's check-in. No worries — see you tomorrow."
                  : "Your daily check-in is ready when you are."}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className="text-[12px] uppercase tracking-[0.04em]"
                style={{ fontFamily: "monospace", color: "rgba(95,109,101,1)" }}
              >
                {day}
              </div>
              <div className="text-[16px] font-semibold tracking-[-0.01em] mt-1">{date}</div>
            </div>
          </div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-12 gap-[18px]">
            <WellbeingCard history={history} />
            <CheckInCard quiz={initialQuiz} />
            <StreakCard streak={streak} />
          </div>
        </main>
      </div>
    </>
  )
}
