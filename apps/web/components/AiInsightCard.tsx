"use client"

import { useState } from "react"
import type React from "react"
import type { AiInsightsResult, AiInsightItem } from "@/types/insights"
import { gql } from "@/lib/api"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

interface AiInsightCardProps {
  data: AiInsightsResult
}

const REFRESH_MUTATION = `
  mutation { refreshAiInsights { items { type emoji insight } generatedAt isExample } }
`

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000 // minutes
  if (diff < 2)  return "just now"
  if (diff < 60) return `${Math.round(diff)}m ago`
  const h = Math.round(diff / 60)
  if (h < 24)    return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

const typeAccent: Record<AiInsightItem["type"], string> = {
  positive: "rgba(62,224,127,0.75)",
  warning:  "rgba(251,191,36,0.75)",
  neutral:  "rgba(154,168,160,0.5)",
}

const typeBg: Record<AiInsightItem["type"], string> = {
  positive: "rgba(62,224,127,0.08)",
  warning:  "rgba(251,191,36,0.07)",
  neutral:  "rgba(255,255,255,0.04)",
}

export function AiInsightCard({ data: initialData }: AiInsightCardProps) {
  const [data, setData] = useState(initialData)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const { items, generatedAt, isExample } = data

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const result = await gql<{ refreshAiInsights: AiInsightsResult }>(REFRESH_MUTATION)
      setData(result.refreshAiInsights)
      router.refresh()
    } catch {
      // silently ignore — stale data stays visible
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <section
      className="col-span-12 lg:col-span-7 rounded-[22px] p-[22px] relative overflow-hidden flex flex-col"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(22px) saturate(140%)",
        WebkitBackdropFilter: "blur(22px) saturate(140%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 60px -40px rgba(0,0,0,0.7)",
      } as React.CSSProperties}
    >
      {/* Subtle corner glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[22px]"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.04), transparent 50%)",
        }}
      />

      <div className="relative flex flex-col gap-[14px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div
              className="text-[13px] font-medium uppercase tracking-[0.02em]"
              style={{ color: "rgba(154,168,160,1)" }}
            >
              AI Insights
            </div>
            <div className="text-[12px] mt-[2px]" style={{ color: "rgba(95,109,101,1)" }}>
              {isExample
                ? "Example · add more data to unlock real analysis"
                : generatedAt
                ? `Updated ${timeAgo(generatedAt)}`
                : "Patterns from your data"}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh insights"
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin" : ""}
                style={{ color: "rgba(154,168,160,0.8)" }}
              />
            </button>

            {/* Spark icon */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base"
              style={{
                background: "rgba(62,224,127,0.10)",
                border: "1px solid rgba(62,224,127,0.18)",
              }}
            >
              ✦
            </div>
          </div>
        </div>

        {/* Insight items */}
        <div className="flex flex-col gap-[10px]">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3 py-3 rounded-[14px]"
              style={{
                background: typeBg[item.type],
                border: `1px solid ${typeAccent[item.type].replace("0.75", "0.15")}`,
              }}
            >
              {/* Emoji */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] flex-shrink-0 mt-[1px]"
                style={{ background: typeBg[item.type] }}
              >
                {item.emoji}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13.5px] leading-[1.6]"
                  style={{ color: "rgba(220,232,224,0.9)" }}
                >
                  {item.insight}
                </p>
              </div>

              {/* Type accent bar */}
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ background: typeAccent[item.type] }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
