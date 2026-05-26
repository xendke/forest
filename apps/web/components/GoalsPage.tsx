"use client"

import { useState } from "react"
import { Plus, Check, Trash2, Sparkles } from "lucide-react"
import { gql } from "@/lib/api"
import { Button } from "@/components/ui/button"
import type { Goal, GoalSuggestion } from "@/types/goals"

// ── mutations ──────────────────────────────────────────────────────────────

const TOGGLE_MUTATION = `
  mutation($goalId: Int!, $date: String!) {
    toggleGoalCompletion(goalId: $goalId, date: $date) {
      id completedToday currentStreak totalCompletions
    }
  }
`

const CREATE_MUTATION = `
  mutation($title: String!, $description: String, $category: String!, $emoji: String!, $frequency: String, $source: String) {
    createGoal(title: $title, description: $description, category: $category, emoji: $emoji, frequency: $frequency, source: $source) {
      id title description category emoji frequency source completedToday currentStreak totalCompletions createdAt
    }
  }
`

const ARCHIVE_MUTATION = `
  mutation($goalId: Int!) {
    archiveGoal(goalId: $goalId)
  }
`

// ── constants ──────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, string> = {
  Mindfulness: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Mood:        "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Focus:       "text-sky-400 bg-sky-400/10 border-sky-400/20",
  Body:        "text-violet-400 bg-violet-400/10 border-violet-400/20",
  Sleep:       "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Social:      "text-rose-400 bg-rose-400/10 border-rose-400/20",
}

const CATEGORIES = ["Mindfulness", "Mood", "Focus", "Body", "Sleep", "Social"]

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

// ── Goal Card ─────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onToggle,
  onArchive,
}: {
  goal: Goal
  onToggle: () => void
  onArchive: () => void
}) {
  const catStyle = CATEGORY_STYLE[goal.category] ?? ""

  return (
    <div
      className="relative group rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: goal.completedToday
          ? "1px solid rgba(76,232,138,0.2)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <span className="text-2xl flex-shrink-0">{goal.emoji}</span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug mb-1 ${goal.completedToday ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {goal.title}
        </p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${catStyle}`}>
            {goal.category}
          </span>
          {goal.currentStreak > 0 && (
            <span className="text-xs text-muted-foreground/50">
              🔥 {goal.currentStreak} day{goal.currentStreak !== 1 ? "s" : ""}
            </span>
          )}
          {goal.currentStreak === 0 && goal.totalCompletions > 0 && (
            <span className="text-xs text-muted-foreground/50">{goal.totalCompletions}× done</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onArchive}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground/30 hover:text-muted-foreground/70 hover:bg-white/[0.04]"
          title="Remove goal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggle}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            goal.completedToday
              ? "bg-primary/15 border-2 border-primary text-primary"
              : "border-2 border-white/20 text-transparent hover:border-primary/40 hover:text-primary/40"
          }`}
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Suggestion Card ───────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAdd,
  isAdding,
}: {
  suggestion: GoalSuggestion
  onAdd: () => void
  isAdding: boolean
}) {
  const catStyle = CATEGORY_STYLE[suggestion.category] ?? ""

  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col gap-3 transition-colors"
      style={{
        background: suggestion.isRecommended ? "rgba(76,232,138,0.03)" : "rgba(255,255,255,0.02)",
        border: suggestion.isRecommended
          ? "1px solid rgba(76,232,138,0.12)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{suggestion.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-1">{suggestion.title}</p>
          {suggestion.description && (
            <p className="text-xs text-muted-foreground/55 leading-relaxed">{suggestion.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${catStyle}`}>
          {suggestion.category}
        </span>
        <button
          onClick={onAdd}
          disabled={isAdding}
          className="flex items-center gap-1 text-xs font-medium text-primary/70 hover:text-primary transition-colors disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAdding ? "Adding…" : "Add goal"}
        </button>
      </div>
    </div>
  )
}

// ── Custom Goal Form ──────────────────────────────────────────────────────

function CustomGoalForm({
  onAdd,
  onCancel,
}: {
  onAdd: (goal: Pick<GoalSuggestion, "title" | "description" | "category" | "emoji" | "frequency" | "isRecommended">) => void
  onCancel: () => void
}) {
  const [emoji, setEmoji] = useState("🎯")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Mindfulness")
  const [description, setDescription] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ emoji, title: title.trim(), category, description: description.trim() || null, frequency: "daily", isRecommended: false })
  }

  const inputClass = "w-full text-sm rounded-xl px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-colors"

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl px-6 py-5 space-y-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="flex gap-3">
        <div className="w-[72px]">
          <label className="text-xs text-muted-foreground/60 mb-1.5 block">Icon</label>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-full text-center text-xl rounded-xl px-2 py-2.5 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary/30"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground/60 mb-1.5 block">Goal name</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cold shower every morning"
            className={inputClass}
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground/60 mb-1.5 block">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground/60 mb-1.5 block">Description <span className="text-muted-foreground/30">(optional)</span></label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this goal mean to you?"
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="rounded-full px-5" disabled={!title.trim()}>
          Add goal
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export function GoalsPage({
  initialGoals,
  suggestions: initialSuggestions,
}: {
  initialGoals: Goal[]
  suggestions: GoalSuggestion[]
}) {
  const [goals, setGoals] = useState(initialGoals)
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [filter, setFilter] = useState<string | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [addingTitles, setAddingTitles] = useState<Set<string>>(new Set())

  const today = todayStr()
  const completedCount = goals.filter((g) => g.completedToday).length

  async function handleToggle(goalId: number) {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, completedToday: !g.completedToday } : g))
    )
    try {
      const data = await gql<{ toggleGoalCompletion: Pick<Goal, "id" | "completedToday" | "currentStreak" | "totalCompletions"> }>(
        TOGGLE_MUTATION,
        { goalId, date: today }
      )
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, ...data.toggleGoalCompletion } : g))
      )
    } catch {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, completedToday: !g.completedToday } : g))
      )
    }
  }

  async function handleArchive(goalId: number) {
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    try {
      await gql(ARCHIVE_MUTATION, { goalId })
    } catch {
      // silent — goal just won't be archived on the backend
    }
  }

  async function handleAddSuggestion(suggestion: GoalSuggestion) {
    setAddingTitles((prev) => new Set(Array.from(prev).concat(suggestion.title)))
    try {
      const data = await gql<{ createGoal: Goal }>(CREATE_MUTATION, {
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        emoji: suggestion.emoji,
        frequency: suggestion.frequency,
        source: "suggested",
      })
      setGoals((prev) => [...prev, data.createGoal])
      setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title))
    } finally {
      setAddingTitles((prev) => {
        const next = new Set(prev)
        next.delete(suggestion.title)
        return next
      })
    }
  }

  async function handleAddCustom(custom: Pick<GoalSuggestion, "title" | "description" | "category" | "emoji" | "frequency" | "isRecommended">) {
    setShowCustomForm(false)
    try {
      const data = await gql<{ createGoal: Goal }>(CREATE_MUTATION, {
        title: custom.title,
        description: custom.description,
        category: custom.category,
        emoji: custom.emoji,
        frequency: custom.frequency,
        source: "manual",
      })
      setGoals((prev) => [...prev, data.createGoal])
    } catch (err) {
      console.error("Failed to create goal:", err)
    }
  }

  const recommended = suggestions.filter((s) => s.isRecommended && (filter === null || s.category === filter))
  const rest = suggestions.filter((s) => !s.isRecommended && (filter === null || s.category === filter))

  return (
    <div className="space-y-10">

      {/* ── Your Goals ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your Goals</h2>
            {goals.length > 0 && (
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                {completedCount} of {goals.length} completed today
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCustomForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full border border-white/[0.07] hover:border-white/15"
          >
            <Plus className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {showCustomForm && (
          <div className="mb-4">
            <CustomGoalForm onAdd={handleAddCustom} onCancel={() => setShowCustomForm(false)} />
          </div>
        )}

        {goals.length === 0 && !showCustomForm ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-3xl mb-3">🌱</div>
            <p className="text-sm font-medium text-foreground mb-1">No goals yet</p>
            <p className="text-xs text-muted-foreground/55 max-w-[240px] mx-auto">
              Pick something from the library below to start building better habits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggle={() => handleToggle(goal.id)}
                onArchive={() => handleArchive(goal.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Discover ── */}
      {suggestions.length > 0 && (
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight mb-1">Discover</h2>
            <p className="text-xs text-muted-foreground/55">Habits proven to support mental wellbeing</p>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setFilter(null)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filter === null
                  ? "text-foreground border-white/20 bg-white/[0.08]"
                  : "text-muted-foreground border-white/[0.07] hover:border-white/15 hover:text-foreground"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? null : cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filter === cat
                    ? CATEGORY_STYLE[cat]
                    : "text-muted-foreground border-white/[0.07] hover:border-white/15 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Recommended */}
          {recommended.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Suggested for you</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommended.map((s) => (
                  <SuggestionCard
                    key={s.title}
                    suggestion={s}
                    onAdd={() => handleAddSuggestion(s)}
                    isAdding={addingTitles.has(s.title)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rest of library */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rest.map((s) => (
                <SuggestionCard
                  key={s.title}
                  suggestion={s}
                  onAdd={() => handleAddSuggestion(s)}
                  isAdding={addingTitles.has(s.title)}
                />
              ))}
            </div>
          )}

          {recommended.length === 0 && rest.length === 0 && (
            <p className="text-sm text-muted-foreground/50 text-center py-6">
              No more suggestions in this category.
            </p>
          )}
        </section>
      )}

    </div>
  )
}
