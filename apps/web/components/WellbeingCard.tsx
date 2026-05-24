"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import type { QuizHistoryEntry } from "@/types/quiz"

// ── chart math ─────────────────────────────────────────────────────────────

function valueToY(v: number, lo: number, hi: number): number {
  return Math.max(40, Math.min(240, 220 - ((v - lo) / (hi - lo)) * 180))
}

function computePaths(
  entries: QuizHistoryEntry[],
  getValue: (e: QuizHistoryEntry) => number | null,
  lo: number,
  hi: number
) {
  const n = entries.length
  if (n < 2) return null

  const pts: { x: number; y: number }[] = []
  entries.forEach((e, i) => {
    const v = getValue(e)
    if (v === null) return
    pts.push({ x: (i / (n - 1)) * 720, y: valueToY(v, lo, hi) })
  })
  if (pts.length < 2) return null

  let line = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1]
    const cx = (p1.x - p0.x) * 0.45
    line += ` C${(p0.x + cx).toFixed(1)},${p0.y.toFixed(1)} ${(p1.x - cx).toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`
  }

  const first = pts[0], last = pts[pts.length - 1]
  const area = `${line} L${last.x.toFixed(1)},240 L${first.x.toFixed(1)},240 Z`
  return { line, area, todayX: last.x, todayY: last.y }
}

function xLabels(entries: QuizHistoryEntry[]) {
  if (entries.length < 2) return []
  const n = entries.length
  const today = new Date().toISOString().split("T")[0]
  const idxs = [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n - 1]
  return idxs.map((i) => ({
    x: (i / (n - 1)) * 720,
    label:
      entries[i].date === today
        ? "TODAY"
        : new Date(entries[i].date + "T00:00:00Z")
            .toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
            .toUpperCase(),
  }))
}

// ── dimension config ───────────────────────────────────────────────────────

const DIMS = {
  well: {
    color: "#4ce88a",
    label: "Composite score",
    unit: "/ 100",
    yLabels: ["100", "75", "50", "25"],
    lo: 25,
    hi: 100,
    getValue: (e: QuizHistoryEntry) => e.wellbeing,
  },
  mood: {
    color: "#7ee0a8",
    label: "Daily mood rating",
    unit: "/ 5",
    yLabels: ["5", "4", "3", "2"],
    lo: 2,
    hi: 5,
    getValue: (e: QuizHistoryEntry) => e.mood,
  },
  calm: {
    color: "#5fd0e0",
    label: "Daily calm (inverse of anxiety)",
    unit: "/ 5",
    yLabels: ["5", "4", "3", "2"],
    lo: 2,
    hi: 5,
    getValue: (e: QuizHistoryEntry) => e.calm,
  },
  focus: {
    color: "#c8b8ff",
    label: "Daily focus rating",
    unit: "/ 5",
    yLabels: ["5", "4", "3", "2"],
    lo: 2,
    hi: 5,
    getValue: (e: QuizHistoryEntry) => e.focus,
  },
} as const

type DimKey = keyof typeof DIMS

const DIM_LABELS: Record<DimKey, string> = {
  well: "Wellbeing",
  mood: "Mood",
  calm: "Calm",
  focus: "Focus",
}

const RANGES = ["7d", "14d", "30d", "90d"]
const RANGE_DAYS: Record<string, number> = { "7d": 7, "14d": 14, "30d": 30, "90d": 90 }

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// ── component ──────────────────────────────────────────────────────────────

interface WellbeingCardProps {
  history: QuizHistoryEntry[]
}

export function WellbeingCard({ history }: WellbeingCardProps) {
  const [dim, setDim] = useState<DimKey>("well")
  const [range, setRange] = useState("14d")
  const [dimOpen, setDimOpen] = useState(false)
  const dimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dimOpen) return
    const handler = (e: MouseEvent) => {
      if (dimRef.current && !dimRef.current.contains(e.target as Node)) setDimOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dimOpen])

  const cfg = DIMS[dim]

  const visible = useMemo(() => {
    const n = RANGE_DAYS[range] ?? history.length
    return history.slice(-n)
  }, [history, range])

  const { paths, todayX, todayY, avg, delta } = useMemo(() => {
    const paths = computePaths(visible, cfg.getValue, cfg.lo, cfg.hi)

    const vals = visible.map((e) => cfg.getValue(e)).filter((v): v is number => v !== null)
    const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null

    const prevN = RANGE_DAYS[range] ?? history.length
    const prevVals = history
      .slice(-prevN * 2, -prevN)
      .map((e) => cfg.getValue(e))
      .filter((v): v is number => v !== null)
    const prevAvg = prevVals.length > 0 ? prevVals.reduce((s, v) => s + v, 0) / prevVals.length : null

    const delta = avg !== null && prevAvg !== null ? avg - prevAvg : null

    return { paths, todayX: paths?.todayX ?? 680, todayY: paths?.todayY ?? 130, avg, delta }
  }, [visible, dim, cfg, history, range])

  const labels = useMemo(() => xLabels(visible), [visible])

  const statNum =
    avg !== null ? (dim === "well" ? Math.round(avg).toString() : avg.toFixed(1)) : "—"

  const deltaStr =
    delta !== null
      ? `${delta >= 0 ? "↑ +" : "↓ "}${dim === "well" ? Math.round(Math.abs(delta)) : Math.abs(delta).toFixed(1)} vs prev`
      : null

  const subLabel = `${cfg.label} · last ${RANGE_DAYS[range] ?? history.length} days`

  const linePath  = paths?.line  ?? ""
  const areaPath  = paths?.area  ?? ""

  return (
    <section
      className="col-span-12 lg:col-span-8 rounded-[22px] p-[22px] relative overflow-hidden"
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

        {/* Header row */}
        <div className="flex gap-3 justify-between items-start mb-[18px]">
          <div className="min-w-0">
            <div className="text-[13px] font-medium uppercase tracking-[0.02em]" style={{ color: "rgba(154,168,160,1)" }}>
              Wellbeing
            </div>
            <div className="text-[12px] mt-[2px]" style={{ color: "rgba(95,109,101,1)" }}>
              {subLabel}
            </div>
          </div>

          {/* Dimension selector — pill tabs on md+, dropdown on mobile */}
          <div className="relative flex-shrink-0" ref={dimRef}>

            {/* Mobile dropdown trigger */}
            <button
              className="md:hidden flex items-center gap-2 px-[14px] py-2 rounded-xl text-[12.5px] font-medium"
              style={{
                color: cfg.color,
                background: hexToRgba(cfg.color, 0.12),
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onClick={() => setDimOpen((o) => !o)}
            >
              <span
                className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                style={{ background: "currentColor", boxShadow: "0 0 8px currentColor" }}
              />
              {DIM_LABELS[dim]}
              <span className={`text-[10px] transition-transform duration-200 ${dimOpen ? "rotate-180" : ""}`}>▾</span>
            </button>

            {dimOpen && (
              <div
                className="md:hidden absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 min-w-[140px]"
                style={{
                  background: "rgba(10,16,13,0.95)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                }}
              >
                {(Object.keys(DIMS) as DimKey[]).map((key) => {
                  const color = DIMS[key].color
                  const isOn = dim === key
                  return (
                    <button
                      key={key}
                      onClick={() => { setDim(key); setDimOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-[13px] font-medium transition-colors text-left"
                      style={{
                        color: isOn ? color : "rgba(154,168,160,0.8)",
                        background: isOn ? hexToRgba(color, 0.10) : "transparent",
                      }}
                    >
                      <span
                        className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                        style={{ background: "currentColor", opacity: isOn ? 1 : 0.7 }}
                      />
                      {DIM_LABELS[key]}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Desktop pill tabs */}
            <div
              className="hidden md:inline-flex gap-1 p-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {(Object.keys(DIMS) as DimKey[]).map((key) => {
                const isOn = dim === key
                const color = DIMS[key].color
                return (
                  <button
                    key={key}
                    onClick={() => setDim(key)}
                    className="flex items-center gap-2 px-[14px] py-2 rounded-lg text-[12.5px] font-medium transition-all"
                    style={{
                      color: isOn ? color : "rgba(154,168,160,0.8)",
                      background: isOn ? hexToRgba(color, 0.12) : "transparent",
                    }}
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                      style={{
                        background: "currentColor",
                        opacity: isOn ? 1 : 0.7,
                        boxShadow: isOn ? "0 0 8px currentColor" : undefined,
                      }}
                    />
                    {DIM_LABELS[key]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Big stat + delta */}
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-[10px]">
            <span className="text-[54px] font-bold tracking-[-0.04em] leading-none" style={{ color: cfg.color }}>
              {statNum}
            </span>
            <span className="text-[18px] font-medium" style={{ color: "rgba(95,109,101,1)" }}>
              {cfg.unit}
            </span>
          </div>
          {deltaStr && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-[10px] py-[5px] rounded-full"
              style={{
                color: cfg.color,
                background: hexToRgba(cfg.color, 0.18),
                border: `1px solid ${hexToRgba(cfg.color, 0.18)}`,
              }}
            >
              {deltaStr}
            </span>
          )}
        </div>

        {/* Chart */}
        <div className="relative mt-[14px]">
          <svg viewBox="0 0 720 240" width="100%" height="240" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="wb-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={cfg.color} stopOpacity={0.38} />
                <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
              </linearGradient>
              <filter id="wb-glow">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* Grid lines */}
            <g stroke="rgba(255,255,255,0.05)" strokeDasharray="2 6">
              <line x1="0" x2="720" y1="40"  y2="40"  />
              <line x1="0" x2="720" y1="100" y2="100" />
              <line x1="0" x2="720" y1="160" y2="160" />
              <line x1="0" x2="720" y1="220" y2="220" />
            </g>

            {/* Y-axis labels */}
            <g fill="#5f6d65" fontSize="10" letterSpacing="1">
              {cfg.yLabels.map((label, i) => (
                <text key={i} x="4" y={44 + i * 60} fontFamily="monospace">{label}</text>
              ))}
            </g>

            {linePath ? (
              <>
                <path fill="url(#wb-area)" d={areaPath} />
                <path fill="none" stroke={cfg.color} strokeWidth="6" strokeLinecap="round" opacity={0.25} filter="url(#wb-glow)" d={linePath} />
                <path fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" d={linePath} />
                <line x1={todayX.toFixed(1)} x2={todayX.toFixed(1)} y1="20" y2="220" stroke="rgba(62,224,127,0.35)" strokeDasharray="3 4" />
                <circle cx={todayX.toFixed(1)} cy={todayY.toFixed(1)} r="11" fill={hexToRgba(cfg.color, 0.18)} />
                <circle cx={todayX.toFixed(1)} cy={todayY.toFixed(1)} r="5"  fill="#0a1410" stroke={cfg.color} strokeWidth="2.5" />
              </>
            ) : (
              <text x="360" y="125" textAnchor="middle" fill="#5f6d65" fontSize="12" fontFamily="monospace">
                No data yet
              </text>
            )}

            {/* X-axis labels */}
            <g fill="#5f6d65" fontSize="10" letterSpacing="1.2">
              {labels.map(({ x, label }) => (
                <text key={label} x={x.toFixed(1)} y="237" fontFamily="monospace" textAnchor="middle">
                  {label}
                </text>
              ))}
            </g>
          </svg>

          {/* Range chips */}
          <div className="inline-flex gap-1 mt-4">
            {RANGES.map((r) => {
              const isOn = range === r
              return (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="text-[10.5px] px-3 py-1.5 rounded-full transition-all"
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    color: isOn ? "#3ee07f" : "#5f6d65",
                    border: isOn ? "1px solid rgba(62,224,127,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    background: isOn ? "rgba(62,224,127,0.06)" : "transparent",
                  }}
                >
                  {r}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
