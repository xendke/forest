import Link from "next/link"

interface AppHeaderProps {
  firstName?: string | null
}

export function AppHeader({ firstName }: AppHeaderProps) {
  const initial = firstName ? firstName[0].toUpperCase() : "?"

  return (
    <header className="px-7 pt-[22px]">
      <nav
        className="max-w-[1280px] mx-auto flex items-center justify-between px-[22px] py-[14px] rounded-full"
        style={{
          background: "rgba(10,16,13,0.55)",
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 30px 60px -40px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex items-center gap-[10px] font-bold tracking-[-0.02em] text-[15px]">
          <div
            className="w-[9px] h-[9px] rounded-full bg-primary flex-shrink-0"
            style={{ boxShadow: "0 0 12px rgba(62,224,127,0.35)" }}
          />
          Forest
        </div>

        <div
          className="flex items-center gap-[4px] p-[3px] rounded-full"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Link
            href="/home"
            className="text-sm font-medium px-[14px] py-2 rounded-full text-foreground transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            Overview
          </Link>
          <Link
            href="/home"
            className="text-sm font-medium px-[14px] py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
          >
            Journal
          </Link>
        </div>

        <div className="flex items-center gap-[14px]">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-primary flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#1a3a28,#0d1f15)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {initial}
          </div>
        </div>
      </nav>
    </header>
  )
}
