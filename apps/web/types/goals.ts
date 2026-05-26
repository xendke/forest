export interface Goal {
  id: number
  title: string
  description: string | null
  category: string
  emoji: string
  frequency: string
  source: string
  completedToday: boolean
  currentStreak: number
  totalCompletions: number
  createdAt: string
}

export interface GoalSuggestion {
  title: string
  description: string | null
  category: string
  emoji: string
  frequency: string
  isRecommended: boolean
}
