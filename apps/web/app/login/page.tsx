import Link from "next/link"
import { AuthForm } from "@/components/AuthForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in — Forest",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(138 50% 10% / 0.7) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 justify-center group"
          >
            <div
              className="w-2.5 h-2.5 rounded-full bg-primary transition-all group-hover:scale-110"
              style={{ boxShadow: "0 0 10px 2px hsl(142 65% 55% / 0.5)" }}
            />
            <span className="font-semibold text-base">Forest</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue your growth
          </p>
        </div>

        <div
          className="rounded-2xl px-8 py-8"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)",
          }}
        >
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  )
}
