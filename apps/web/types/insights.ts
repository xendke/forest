export interface AiInsightItem {
  type: 'positive' | 'warning' | 'neutral'
  emoji: string
  insight: string
  detail?: string
}

export interface AiInsightsResult {
  items: AiInsightItem[]
  generatedAt: string | null
  isExample: boolean
}
