import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerToken } from "@/lib/auth"
import { NavTabs } from "@/components/NavTabs"
import { SproutIcon } from "@/components/SproutIcon"

const navStyle = {
  background: "rgba(5, 15, 8, 0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.07)",
} as React.CSSProperties

type NavVariant = "marketing" | "app"

interface NavbarProps {
  variant?: NavVariant
  firstName?: string | null
}

export function Navbar({ variant = "marketing", firstName }: NavbarProps) {
  const isLoggedIn = variant === "marketing" ? !!getServerToken() : false
  const isApp = variant === "app"
  const initial = firstName ? firstName[0].toUpperCase() : "?"

  return (
    <header
      className={
        isApp ? "px-4 sm:px-7 pt-[22px]" : "fixed top-0 left-0 right-0 z-50 px-4 pt-4"
      }
    >
      <nav
        className={`${
          isApp ? "max-w-[1280px]" : "max-w-5xl"
        } mx-auto flex items-center justify-between px-5 py-3 rounded-2xl`}
        style={navStyle}
      >
        {isApp ? (
          /* App: brand + tabs grouped on the left */
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <SproutIcon size={22} />
              <span className="font-semibold text-base tracking-tight text-foreground">Forest</span>
            </Link>
            <NavTabs />
          </div>
        ) : (
          /* Marketing: brand on the left */
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <SproutIcon size={22} />
            <span className="font-semibold text-base tracking-tight text-foreground">Forest</span>
          </Link>
        )}

        {/* Right side */}
        {isApp ? (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-primary flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#1a3a28,#0d1f15)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {initial}
          </div>
        ) : (
          <div className="flex items-center gap-4 md:gap-5">
            <Link
              href="#how-it-works"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#demo"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Demo
            </Link>
            <Button size="sm" className="rounded-full px-5 text-xs font-semibold h-8" asChild>
              <Link href={isLoggedIn ? "/home" : "/join"}>
                {isLoggedIn ? "Dashboard" : "Join Now"}
              </Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  )
}
