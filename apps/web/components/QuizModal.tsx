"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { gql } from "@/lib/api"
import type { DailyQuiz, QuestionType } from "@/types/quiz"

// ── graphql ────────────────────────────────────────────────────────────────

const TODAY_QUIZ = `query {
  todayQuiz {
    id completed skipped
    questions { id text category type options }
    responses { questionId answer skipped }
  }
}`

const SUBMIT_RESPONSE = `
  mutation($quizId: Int!, $questionId: Int!, $answer: String, $skipped: Boolean) {
    submitQuizResponse(quizId: $quizId, questionId: $questionId, answer: $answer, skipped: $skipped) {
      id questionId answer skipped
    }
  }
`

const COMPLETE_QUIZ = `
  mutation($quizId: Int!, $skipped: Boolean) {
    completeQuiz(quizId: $quizId, skipped: $skipped) {
      id completed skipped
    }
  }
`

// ── answer inputs ──────────────────────────────────────────────────────────

function ScaleInput({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`w-12 h-12 rounded-full text-sm font-semibold transition-all border ${
              value === opt
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_16px_2px] shadow-primary/40"
                : "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex justify-between w-full px-1 text-xs text-muted-foreground/50">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}

function OptionInput({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`w-full py-3 px-5 rounded-xl text-sm font-medium transition-all border text-left ${
            value === opt
              ? "bg-primary/15 border-primary/50 text-foreground"
              : "bg-white/[0.03] border-white/[0.07] text-muted-foreground hover:border-white/20 hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function FreeTextInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write freely — there's no wrong answer."
      rows={4}
      className="w-full rounded-xl px-4 py-3 text-sm bg-white/[0.04] border border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 resize-none transition-colors"
    />
  )
}

// ── category pill ──────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, string> = {
  Mood: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Anxiety: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Focus: "text-sky-400 bg-sky-400/10 border-sky-400/20",
}

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 32px 100px rgba(0,0,0,0.5)",
}

// ── main component ─────────────────────────────────────────────────────────

type Screen = "loading" | "hidden" | "welcome" | "question" | "done"

interface QuizModalProps {
  initialQuiz?: DailyQuiz | null
}

function initAnswers(quiz: DailyQuiz | null | undefined): Record<number, string> {
  const saved: Record<number, string> = {}
  quiz?.responses.forEach((r) => { if (r.answer) saved[r.questionId] = r.answer })
  return saved
}

export function QuizModal({ initialQuiz }: QuizModalProps) {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>(() => {
    if (initialQuiz === undefined) return "loading"
    if (!initialQuiz || initialQuiz.completed || initialQuiz.skipped) return "hidden"
    return "welcome"
  })
  const [quiz, setQuiz] = useState<DailyQuiz | null>(initialQuiz ?? null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>(() => initAnswers(initialQuiz))
  const [submitting, setSubmitting] = useState(false)

  // Lock body scroll while the modal is visible
  useEffect(() => {
    const isOpen = screen !== "hidden" && screen !== "loading"
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [screen])

  // Client-side fallback fetch — only runs on mount when server didn't provide data
  useEffect(() => {
    if (initialQuiz !== undefined) return
    gql<{ todayQuiz: DailyQuiz | null }>(TODAY_QUIZ)
      .then(({ todayQuiz }) => {
        if (!todayQuiz || todayQuiz.completed || todayQuiz.skipped) {
          setScreen("hidden")
          return
        }
        setAnswers(initAnswers(todayQuiz))
        setQuiz(todayQuiz)
        setScreen("welcome")
      })
      .catch(() => setScreen("hidden"))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Respond when initialQuiz prop changes (e.g. after router.refresh() on reopen)
  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    if (!initialQuiz || initialQuiz.completed || initialQuiz.skipped) {
      setScreen("hidden")
      return
    }
    setQuiz(initialQuiz)
    setAnswers(initAnswers(initialQuiz))
    setCurrentIndex(0)
    setScreen("welcome")
  }, [initialQuiz])

  const currentQuestion = quiz?.questions[currentIndex] ?? null
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] ?? "") : ""
  const total = quiz?.questions.length ?? 0
  const isLast = currentIndex === total - 1

  const setAnswer = (v: string) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }))
  }

  const saveAndAdvance = async (skipQuestion = false) => {
    if (!quiz || !currentQuestion) return
    setSubmitting(true)
    try {
      await gql(SUBMIT_RESPONSE, {
        quizId: quiz.id,
        questionId: currentQuestion.id,
        answer: skipQuestion ? null : currentAnswer || null,
        skipped: skipQuestion,
      })
      if (isLast) {
        await gql(COMPLETE_QUIZ, { quizId: quiz.id, skipped: false })
        setScreen("done")
      } else {
        setCurrentIndex((i) => i + 1)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const skipQuiz = async () => {
    if (!quiz) return
    await gql(COMPLETE_QUIZ, { quizId: quiz.id, skipped: true })
    setScreen("hidden")
    router.refresh()
  }

  if (screen === "loading" || screen === "hidden") return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-md rounded-3xl px-8 py-10" style={cardStyle}>

        {screen === "welcome" && (
          <div className="text-center space-y-7">
            <div className="space-y-2">
              <div className="flex justify-center mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" style={{ boxShadow: "0 0 14px 3px hsl(142 65% 55% / 0.5)" }} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Daily Check-in</h2>
              <p className="text-sm text-muted-foreground">{total} questions · ~2 minutes</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full rounded-full" size="lg" onClick={() => setScreen("question")}>
                Start →
              </Button>
              <button onClick={skipQuiz} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                Skip for today
              </button>
            </div>
          </div>
        )}

        {screen === "question" && currentQuestion && (
          <div className="space-y-7">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground/60">
                <span>{currentIndex + 1} / {total}</span>
                <span>{Math.round(((currentIndex + 1) / total) * 100)}%</span>
              </div>
              <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_STYLE[currentQuestion.category] ?? ""}`}>
                {currentQuestion.category}
              </span>
              <h3 className="text-xl font-semibold leading-snug">{currentQuestion.text}</h3>
            </div>

            <div>
              {currentQuestion.type === "scale" && (
                <ScaleInput options={currentQuestion.options} value={currentAnswer} onChange={setAnswer} />
              )}
              {(currentQuestion.type === "binary" || currentQuestion.type === "three_option") && (
                <OptionInput options={currentQuestion.options} value={currentAnswer} onChange={setAnswer} />
              )}
              {currentQuestion.type === "free_text" && (
                <FreeTextInput value={currentAnswer} onChange={setAnswer} />
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)} className="text-muted-foreground">
                ← Back
              </Button>
              <Button size="sm" disabled={submitting} onClick={() => saveAndAdvance(false)} className="rounded-full px-6">
                {submitting ? "…" : isLast ? "Submit" : "Next →"}
              </Button>
            </div>

            <div className="text-center">
              <button onClick={() => saveAndAdvance(true)} disabled={submitting} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                Skip this question
              </button>
            </div>
          </div>
        )}

        {screen === "done" && (
          <div className="text-center space-y-7">
            <div className="space-y-2">
              <div className="flex justify-center mb-3">
                <div className="w-3 h-3 rounded-full bg-primary" style={{ boxShadow: "0 0 20px 5px hsl(142 65% 55% / 0.5)" }} />
              </div>
              <h2 className="text-2xl font-bold">All done for today.</h2>
              <p className="text-sm text-muted-foreground">Great work. See you tomorrow.</p>
            </div>
            <Button
              className="w-full rounded-full"
              size="lg"
              onClick={() => { setScreen("hidden"); router.refresh() }}
            >
              Close
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
