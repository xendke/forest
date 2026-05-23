import { Activity, TrendingUp, Sprout } from "lucide-react"

const features = [
  {
    icon: Activity,
    title: "Daily Check-ins",
    description:
      "Log your mood in seconds with intuitive, distraction-free inputs built for consistency.",
  },
  {
    icon: TrendingUp,
    title: "Growth Insights",
    description:
      "Visualize emotional patterns over time and uncover what shapes your wellbeing.",
  },
  {
    icon: Sprout,
    title: "Self-growth Tools",
    description:
      "Guided exercises, reflections, and prompts that help you grow with intention.",
  },
]

export function Features() {
  return (
    <section id="how-it-works" className="relative py-32 px-4 overflow-hidden">
      {/* Subtle section divider glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(142 65% 55% / 0.3), transparent)",
        }}
      />

      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-3 max-w-lg mx-auto">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-primary/70">
            Why Forest
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to grow.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            A focused set of tools that keep things simple without sacrificing depth.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl p-7 space-y-4 transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: "rgba(255, 255, 255, 0.025)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                style={{
                  background: "hsl(142 65% 55% / 0.12)",
                  border: "1px solid hsl(142 65% 55% / 0.2)",
                }}
              >
                <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
