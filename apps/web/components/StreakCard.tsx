import type { StreakInfo } from "@/types/quiz"

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"]

interface StreakCardProps {
  streak: StreakInfo
}

export function StreakCard({ streak }: StreakCardProps) {
  const isPersonalBest = streak.current > 0 && streak.current >= streak.best

  return (
    <section
      className="col-span-12 lg:col-span-5 rounded-[22px] p-[22px] relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(22px) saturate(140%)",
        WebkitBackdropFilter: "blur(22px) saturate(140%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 60px -40px rgba(0,0,0,0.7)",
      }}
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
              Check-in streak
            </div>
            <div className="text-[12px] mt-[2px]" style={{ color: "rgba(95,109,101,1)" }}>
              Keep it growing
            </div>
          </div>
          {isPersonalBest && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-[10px] py-[5px] rounded-full"
              style={{
                color: "#3ee07f",
                background: "rgba(62,224,127,0.18)",
                border: "1px solid rgba(62,224,127,0.18)",
              }}
            >
              🌱 personal best
            </span>
          )}
        </div>

        {/* Streak number */}
        <div className="flex items-baseline gap-[8px] mt-2">
          <span
            className="text-[48px] font-bold tracking-[-0.04em] leading-none"
            style={{ color: "#3ee07f" }}
          >
            {streak.current}
          </span>
          <span className="text-[14px]" style={{ color: "rgba(154,168,160,1)" }}>
            days in a row
          </span>
        </div>

        {/* Week dots */}
        <div className="flex gap-2 mt-[18px]">
          {streak.last7.map((day) => {
            const d = new Date(day.date + "T00:00:00Z")
            const label = DAY_INITIALS[d.getUTCDay()]
            const isCompleted = day.status === "completed"
            const isSkipped   = day.status === "skipped"
            const isToday     = day.status === "today"

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-[8px]">
                <div
                  className="w-full rounded-[8px]"
                  style={{
                    aspectRatio: "1",
                    background: isCompleted
                      ? "#3ee07f"
                      : isSkipped
                      ? "rgba(62,224,127,0.35)"
                      : isToday
                      ? "rgba(62,224,127,0.08)"
                      : "transparent",
                    border: isCompleted || isSkipped
                      ? "none"
                      : isToday
                      ? "1px solid rgba(62,224,127,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: isCompleted ? "0 0 12px -2px rgba(62,224,127,0.5)" : "none",
                  }}
                />
                <span
                  className="text-[10px]"
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    color: "rgba(95,109,101,1)",
                  }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
