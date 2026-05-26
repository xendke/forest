import Anthropic from '@anthropic-ai/sdk'

export interface InsightItem {
  type: 'positive' | 'warning' | 'neutral'
  emoji: string
  insight: string
  detail?: string
}

const PLACEHOLDER_INSIGHTS: InsightItem[] = [
  {
    type: 'neutral',
    emoji: '📊',
    insight:
      'Complete at least 7 daily check-ins to unlock real pattern analysis. Forest will start spotting what lifts your mood and what drains it.',
  },
  {
    type: 'positive',
    emoji: '✍️',
    insight:
      'Try adding journal entries alongside your check-ins — combining scores with your own words gives the AI much richer context to work with.',
  },
]

const SYSTEM_PROMPT = `You are analyzing a user's mental wellbeing data from a daily mood-tracking app. Find 3–4 specific, meaningful observations.

Look for:
- Correlations between journal language (words, themes, activities) and mood/anxiety/focus scores
- Day-of-week patterns (weekends vs weekdays)
- Trends over time (improving or declining streaks)
- What the user's best days and worst days have in common
- Any habit or activity mentioned in journals that correlates with score changes

Return a JSON array of 3–4 objects with exactly these fields:
- "type": one of "positive", "warning", "neutral"
- "emoji": one relevant emoji character
- "insight": a SHORT headline (max 12 words, no dates or numbers). State the pattern plainly. Example: "Mood and anxiety improve on days you exercise."
- "detail": 1–2 sentences expanding on the evidence — this is where you can cite specific patterns, timeframes, or quoted journal words. Keep it conversational.

Return ONLY valid JSON — no markdown fences, no explanation, nothing else.`

export async function generateInsights(
  quizData: Array<{ date: string; mood: number; anxiety: number; focus: number }>,
  journalEntries: Array<{ date: string; content: string }>
): Promise<InsightItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const client = new Anthropic({ apiKey })

  const dataBundle = JSON.stringify(
    {
      quizScores: quizData,
      journalEntries: journalEntries.map((e) => ({
        date: e.date,
        // Trim very long entries to keep token count manageable
        content: e.content.length > 600 ? e.content.slice(0, 600) + '…' : e.content,
      })),
    },
    null,
    2
  )

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Here is the user's data:\n\n${dataBundle}` }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  // Strip markdown code fences if the model wraps the JSON anyway
  const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const parsed = JSON.parse(json) as InsightItem[]

  // Validate shape — if Claude went rogue, throw so caller can fall back
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid AI response shape')
  return parsed
}

export { PLACEHOLDER_INSIGHTS }
