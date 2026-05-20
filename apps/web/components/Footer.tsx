import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-white/[0.05]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            style={{ boxShadow: "0 0 6px 1px hsl(142 65% 55% / 0.4)" }}
          />
          <span className="font-medium text-foreground/70">Forest</span>
        </div>

        <p>
          Made by{" "}
          <Link
            href="https://xendke.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            xendke
          </Link>
        </p>
      </div>
    </footer>
  )
}
