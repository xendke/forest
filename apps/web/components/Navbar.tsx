import Link from "next/link"
import { NavCTA } from "@/components/NavCTA"

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav
        className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3 rounded-2xl"
        style={{
          background: "rgba(5, 15, 8, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-2.5 h-2.5 rounded-full bg-primary transition-all group-hover:scale-110"
            style={{ boxShadow: "0 0 10px 2px hsl(142 65% 55% / 0.5)" }}
          />
          <span className="font-semibold text-base tracking-tight text-foreground">
            Forest
          </span>
        </Link>

        <div className="flex items-center gap-7">
          <Link
            href="#about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="#demo"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Demo
          </Link>
          <NavCTA />
        </div>
      </nav>
    </header>
  )
}
