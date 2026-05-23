import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerToken } from "@/lib/auth"

export function Hero() {
  const isLoggedIn = !!getServerToken()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -5%, hsl(138 50% 12% / 0.8) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "hsl(142 65% 40% / 0.08)", filter: "blur(100px)" }}
      />
      <div
        className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "hsl(142 65% 35% / 0.06)", filter: "blur(90px)" }}
      />

      <div
        className="relative z-10 w-full max-w-2xl text-center rounded-3xl px-10 py-16 space-y-8"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="space-y-5">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-primary/70">
            Mood Tracking · Self Growth
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold leading-[1.08] tracking-tight">
            Track Your Mind.
            <br />
            <span className="text-primary">Cultivate Growth.</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Simple, engaging mood tracking with powerful self-growth tools —
            built to help you understand yourself and grow every day.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          {isLoggedIn ? (
            <Button size="lg" asChild>
              <Link href="/home">Dashboard →</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="lg" asChild>
                <Link href="#how-it-works">How it works</Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/join">Join Now →</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 flex flex-col items-center gap-2 text-muted-foreground/40">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-current" />
        <span className="text-[11px] tracking-widest uppercase">Scroll</span>
      </div>
    </section>
  )
}
