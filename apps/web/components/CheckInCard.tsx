import type React from "react"
import type { DailyQuiz } from "@/types/quiz"

const QUICK_LABEL: Record<string, string> = {
  "Did you experience any moments of calm or relief today?": "Moments of calm",
  "Were you able to focus when you needed to today?": "Focus when needed",
  "Did you feel more positive or negative emotions today?": "Mood balance",
  "How much did anxious thoughts get in your way today?": "Anxious thoughts",
}

const cardStyle = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 60px -40px rgba(0,0,0,0.7)",
} as React.CSSProperties

interface CheckInCardProps {
  quiz: DailyQuiz | null
}

export function CheckInCard({ quiz }: CheckInCardProps) {
  const quickQuestions = quiz?.questions.filter((q) => q.type !== "free_text") ?? []
  const scaleQuestions = quickQuestions.filter((q) => q.type === "scale")
  const tagQuestions = quickQuestions.filter(
    (q) => q.type === "binary" || q.type === "three_option"
  )
  const answeredCount = quickQuestions.filter((q) => {
    const r = quiz?.responses.find((r) => r.questionId === q.id)
    return r && !r.skipped && r.answer
  }).length

  const hasAnswers = quiz?.completed && answeredCount > 0

  return (
    <section
      className="col-span-12 lg:col-span-4 rounded-[22px] p-[22px] relative overflow-hidden"
      style={cardStyle}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-[22px]"
        style={{
          background: "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.04), transparent 50%)",
        }}
      />
      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-[18px]">
          <div>
            <div
              className="text-[13px] font-medium uppercase tracking-[0.02em]"
              style={{ color: "rgba(154,168,160,1)" }}
            >
              Today&apos;s check-in
            </div>
            <div className="text-[12px] mt-[2px]" style={{ color: "rgba(95,109,101,1)" }}>
              {hasAnswers ? "Completed" : quiz?.skipped ? "Skipped for today" : "Not yet logged"}
            </div>
          </div>
          {hasAnswers && (
            <span
              className="inline-flex items-center text-[11px] font-medium px-[10px] py-[5px] rounded-full"
              style={{
                color: "#3ee07f",
                background: "rgba(62,224,127,0.18)",
                border: "1px solid rgba(62,224,127,0.18)",
              }}
            >
              {answeredCount} / {quickQuestions.length}
            </span>
          )}
        </div>

        {hasAnswers ? (
          <div className="flex flex-col gap-[13px]">
            {/* Scale meters */}
            {scaleQuestions.map((q) => {
              const resp = quiz?.responses.find((r) => r.questionId === q.id)
              const val = resp?.answer ? parseInt(resp.answer) : 0
              const max = q.options.length
              return (
                <div key={q.id} className="flex flex-col gap-[7px]">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-medium">{q.category}</span>
                    <span
                      className="text-[11px] tracking-[0.06em]"
                      style={{ fontFamily: "monospace", color: "rgba(95,109,101,1)" }}
                    >
                      {val || "—"} / {max}
                    </span>
                  </div>
                  <div className="flex gap-[6px]">
                    {Array.from({ length: max }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-[6px] rounded-full"
                        style={{
                          background:
                            i < val
                              ? "linear-gradient(90deg,#4ce88a,#22c06a)"
                              : "rgba(255,255,255,0.05)",
                          boxShadow:
                            i < val ? "0 0 8px -2px rgba(62,224,127,0.5)" : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Divider */}
            <div
              className="my-1"
              style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}
            />

            {/* Tag questions */}
            <div className="flex flex-wrap gap-[6px]">
              {tagQuestions.map((q) => {
                const resp = quiz?.responses.find((r) => r.questionId === q.id)
                const answer = resp?.skipped ? null : resp?.answer
                const label = QUICK_LABEL[q.text] ?? q.category
                return (
                  <span
                    key={q.id}
                    className="text-[11px] px-[9px] py-[5px] rounded-full"
                    style={{
                      fontFamily: "monospace",
                      letterSpacing: "0.04em",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(154,168,160,1)",
                    }}
                  >
                    {label}{" "}
                    <b style={{ color: "#3ee07f", fontWeight: 600, marginLeft: 4 }}>
                      {answer ?? "—"}
                    </b>
                  </span>
                )
              })}
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center py-8 gap-3"
            style={{ color: "rgba(95,109,101,1)" }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "rgba(62,224,127,0.3)" }}
            />
            <p className="text-[13px] leading-relaxed">
              {quiz?.skipped
                ? "You skipped today's check-in."
                : "Complete your daily check-in to see your results here."}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
