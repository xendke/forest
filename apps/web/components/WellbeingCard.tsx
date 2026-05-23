"use client"

import { useState } from "react"

const DIMENSIONS = {
  well: {
    color: "#4ce88a",
    label: "Composite score · last 14 days",
    num: "74",
    unit: "/ 100 weekly avg",
    delta: "+8 vs prev",
    yLabels: ["100", "75", "50", "25"],
    d: "M0,150 C40,142 70,155 110,135 C150,118 180,128 220,118 C260,108 300,115 330,95 C370,80 400,98 440,78 C480,60 510,78 550,55 C590,48 620,62 660,48 C700,38 720,42 720,42",
  },
  mood: {
    color: "#7ee0a8",
    label: "Daily mood rating · last 14 days",
    num: "4.1",
    unit: "/ 5 weekly avg",
    delta: "+0.4 vs prev",
    yLabels: ["5", "4", "3", "2"],
    d: "M0,140 C40,128 70,148 110,125 C150,108 180,128 220,115 C260,100 300,118 330,92 C370,75 400,100 440,78 C480,58 510,82 550,52 C590,45 620,68 660,48 C700,36 720,42 720,40",
  },
  calm: {
    color: "#5fd0e0",
    label: "Daily calm (inverse of anxiety) · last 14 days",
    num: "3.6",
    unit: "/ 5 weekly avg",
    delta: "+0.3 vs prev",
    yLabels: ["5", "4", "3", "2"],
    d: "M0,168 C40,178 70,160 110,165 C150,170 180,152 220,148 C260,142 300,150 330,128 C370,118 400,128 440,108 C480,98 510,118 550,90 C590,82 620,98 660,80 C700,72 720,76 720,78",
  },
  focus: {
    color: "#c8b8ff",
    label: "Daily focus rating · last 14 days",
    num: "3.8",
    unit: "/ 5 weekly avg",
    delta: "+0.2 vs prev",
    yLabels: ["5", "4", "3", "2"],
    d: "M0,128 C40,142 70,118 110,138 C150,152 180,118 220,128 C260,140 300,108 330,118 C370,128 400,90 440,108 C480,118 510,82 550,92 C590,102 620,68 660,80 C700,90 720,75 720,78",
  },
} as const

type DimKey = keyof typeof DIMENSIONS

const DIM_LABELS: Record<DimKey, string> = {
  well: "Wellbeing",
  mood: "Mood",
  calm: "Calm",
  focus: "Focus",
}

const RANGES = ["7d", "14d", "30d", "90d"]

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export function WellbeingCard() {
  const [dim, setDim] = useState<DimKey>("well")
  const [range, setRange] = useState("14d")

  const d = DIMENSIONS[dim]
  const areaPath = `${d.d} L720,240 L0,240 Z`
  const todayY = d.d.match(/720,(\d+(?:\.\d+)?)$/)?.[1] ?? "42"

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
        <div className="flex flex-wrap gap-3 justify-between items-start mb-[18px]">
          <div>
            <div
              className="text-[13px] font-medium uppercase tracking-[0.02em]"
              style={{ color: "rgba(154,168,160,1)" }}
            >
              Wellbeing
            </div>
            <div className="text-[12px] mt-[2px]" style={{ color: "rgba(95,109,101,1)" }}>
              {d.label}
            </div>
          </div>

          {/* Dimension tabs */}
          <div
            className="inline-flex gap-1 p-1 rounded-xl flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {(Object.keys(DIMENSIONS) as DimKey[]).map((key) => {
              const isOn = dim === key
              const color = DIMENSIONS[key].color
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

        {/* Big stat + delta */}
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-[10px]">
            <span
              className="text-[54px] font-bold tracking-[-0.04em] leading-none"
              style={{ color: d.color }}
            >
              {d.num}
            </span>
            <span className="text-[18px] font-medium" style={{ color: "rgba(95,109,101,1)" }}>
              {d.unit}
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-[10px] py-[5px] rounded-full"
            style={{
              color: d.color,
              background: hexToRgba(d.color, 0.18),
              border: `1px solid ${hexToRgba(d.color, 0.18)}`,
            }}
          >
            <span className="text-[10px]">↑</span> {d.delta}
          </span>
        </div>

        {/* Chart */}
        <div className="relative mt-[14px]">
          <svg
            viewBox="0 0 720 240"
            width="100%"
            height="240"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="wb-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={d.color} stopOpacity={0.42} />
                <stop offset="100%" stopColor={d.color} stopOpacity={0} />
              </linearGradient>
              <filter id="wb-glow">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* Grid lines */}
            <g stroke="rgba(255,255,255,0.05)" strokeDasharray="2 6">
              <line x1="0" x2="720" y1="40" y2="40" />
              <line x1="0" x2="720" y1="100" y2="100" />
              <line x1="0" x2="720" y1="160" y2="160" />
              <line x1="0" x2="720" y1="220" y2="220" />
            </g>

            {/* Y-axis labels */}
            <g fill="#5f6d65" fontSize="10" letterSpacing="1">
              {d.yLabels.map((label, i) => (
                <text key={i} x="4" y={44 + i * 60} fontFamily="monospace">
                  {label}
                </text>
              ))}
            </g>

            {/* Area fill */}
            <path fill="url(#wb-area)" d={areaPath} />

            {/* Glow line */}
            <path
              fill="none"
              stroke={d.color}
              strokeWidth="6"
              strokeLinecap="round"
              opacity={0.3}
              filter="url(#wb-glow)"
              d={d.d}
            />

            {/* Main line */}
            <path fill="none" stroke={d.color} strokeWidth="2.5" strokeLinecap="round" d={d.d} />

            {/* Today marker */}
            <line
              x1="700"
              x2="700"
              y1="20"
              y2="220"
              stroke="rgba(62,224,127,0.4)"
              strokeDasharray="3 4"
            />
            <circle cx="700" cy={todayY} r="11" fill={hexToRgba(d.color, 0.18)} />
            <circle cx="700" cy={todayY} r="5" fill="#0a1410" stroke={d.color} strokeWidth="2.5" />

            {/* X-axis labels */}
            <g fill="#5f6d65" fontSize="10" letterSpacing="1.2">
              <text x="34" y="237" fontFamily="monospace">
                MAY 09
              </text>
              <text x="180" y="237" fontFamily="monospace">
                MAY 13
              </text>
              <text x="345" y="237" fontFamily="monospace">
                MAY 16
              </text>
              <text x="510" y="237" fontFamily="monospace">
                MAY 19
              </text>
              <text x="664" y="237" fontFamily="monospace">
                TODAY
              </text>
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
                    border: isOn
                      ? "1px solid rgba(62,224,127,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
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
