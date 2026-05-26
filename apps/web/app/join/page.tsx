import Link from "next/link"
import { AuthForm } from "@/components/AuthForm"
import { SproutIcon } from "@/components/SproutIcon"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join Forest — Create your account",
}

export default function JoinPage() {
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
            <SproutIcon size={22} />
            <span className="font-semibold text-base">Forest</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start tracking your mood today
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
          <AuthForm mode="join" />
        </div>
      </div>
    </div>
  )
}
