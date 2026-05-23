// Plain JS so it runs in production without ts-node compilation
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const questions = [
  // ── Quick questions (shown every day) ──────────────────────────────
  {
    text: 'How would you rate your mood overall today?',
    category: 'Mood',
    type: 'scale',
    isQuick: true,
    options: ['1', '2', '3', '4', '5'],
  },
  {
    text: 'How stressed or anxious have you felt today?',
    category: 'Anxiety',
    type: 'scale',
    isQuick: true,
    options: ['1', '2', '3', '4', '5'],
  },
  {
    text: 'How productive did you feel today?',
    category: 'Focus',
    type: 'scale',
    isQuick: true,
    options: ['1', '2', '3', '4', '5'],
  },
  {
    text: 'Did you experience any moments of calm or relief today?',
    category: 'Anxiety',
    type: 'binary',
    isQuick: true,
    options: ['Yes', 'No'],
  },
  {
    text: 'Were you able to focus when you needed to today?',
    category: 'Focus',
    type: 'three_option',
    isQuick: true,
    options: ['Yes', 'Mostly', 'No'],
  },
  {
    text: 'Did you feel more positive or negative emotions today?',
    category: 'Mood',
    type: 'three_option',
    isQuick: true,
    options: ['Positive', 'Mixed', 'Negative'],
  },
  {
    text: 'How much did anxious thoughts get in your way today?',
    category: 'Anxiety',
    type: 'three_option',
    isQuick: true,
    options: ['Not at all', 'A little', 'A lot'],
  },
  // ── Open-ended questions (2 randomly selected each day) ───────────
  {
    text: "What's the biggest thing on your mind right now?",
    category: 'Anxiety',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
  {
    text: 'Describe your mood in a few words or a sentence.',
    category: 'Mood',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
  {
    text: 'What was the highlight of your day, if any?',
    category: 'Mood',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
  {
    text: 'Was there a moment today that felt overwhelming? What happened?',
    category: 'Anxiety',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
  {
    text: 'What got in the way of your focus today, if anything?',
    category: 'Focus',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
  {
    text: "Is there anything you're dreading or looking forward to tomorrow?",
    category: 'Anxiety',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
  {
    text: "What's one thing you did today that you're proud of, however small?",
    category: 'Mood',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
  {
    text: 'What task or goal felt hardest to get started on today?',
    category: 'Focus',
    type: 'free_text',
    isQuick: false,
    options: [],
  },
]

async function main() {
  const count = await prisma.question.count()
  if (count > 0) {
    console.log(`Question bank already seeded (${count} questions) — skipping`)
    return
  }
  await prisma.question.createMany({ data: questions })
  console.log(`Seeded ${questions.length} questions`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
