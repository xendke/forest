export interface InsightItem {
  type: 'positive' | 'warning' | 'neutral'
  emoji: string
  insight: string
  detail?: string
}

export interface InsightsResult {
  items: InsightItem[]
  generatedAt: string | null
  isExample: boolean
}
