"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LogOut } from "lucide-react"

export function UserMenu({ initial }: { initial: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-primary transition-opacity hover:opacity-80"
        style={{
          background: "linear-gradient(135deg,#1a3a28,#0d1f15)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
        aria-label="User menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-xl py-1 z-50"
          style={{
            background: "rgba(10,20,14,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}
        >
          <Link
            href="/logout"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Log out
          </Link>
        </div>
      )}
    </div>
  )
}
