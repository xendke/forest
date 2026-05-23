"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

const TABS = [
  { label: "Overview", href: "/home" },
  { label: "Journal", href: "/home/journal" },
]

const tabGroupStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
} as React.CSSProperties

const dropdownStyle = {
  background: "rgba(10,16,13,0.92)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
  minWidth: "140px",
} as React.CSSProperties

export function NavTabs() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = TABS.find((t) => pathname === t.href) ?? TABS[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <>
      {/* Desktop: pill tabs */}
      <div className="hidden md:flex items-center gap-[4px] p-[3px] rounded-full" style={tabGroupStyle}>
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm font-medium px-[14px] py-2 rounded-full transition-colors ${
              pathname === tab.href
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            }`}
            style={pathname === tab.href ? { background: "rgba(255,255,255,0.06)" } : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Mobile: dropdown */}
      <div className="md:hidden relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground px-[14px] py-2 rounded-full transition-colors"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {active.label}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden z-50" style={dropdownStyle}>
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === tab.href
                    ? "text-foreground bg-white/[0.08]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
