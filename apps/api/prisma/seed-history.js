// Seeds ~30 days of realistic historical quiz data for xendke@gmail.com
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Deterministic pseudo-random: same (day, col) always returns the same value
function sr(day, col) {
  const x = Math.sin(day * 127.1 + col * 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Day indices (0 = 30 days ago, 29 = yesterday) that are recorded as skipped
const SKIP_INDICES = new Set([3, 9, 15, 22, 28])

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'xendke@gmail.com' } })
  if (!user) {
    console.log('User xendke@gmail.com not found — skipping history seed')
    return
  }

  const allQs = await prisma.question.findMany({ orderBy: { id: 'asc' } })
  const quickQs = allQs.filter((q) => q.isQuick)

  const moodScaleQ     = quickQs.find((q) => q.category === 'Mood'    && q.type === 'scale')
  const anxietyScaleQ  = quickQs.find((q) => q.category === 'Anxiety' && q.type === 'scale')
  const focusScaleQ    = quickQs.find((q) => q.category === 'Focus'   && q.type === 'scale')
  const calmBinaryQ    = quickQs.find((q) => q.type === 'binary')
  const focusOptionQ   = quickQs.find((q) => q.category === 'Focus'   && q.type === 'three_option')
  const moodOptionQ    = quickQs.find((q) => q.category === 'Mood'    && q.type === 'three_option')
  const anxietyOptionQ = quickQs.find((q) => q.category === 'Anxiety' && q.type === 'three_option')

  if (!moodScaleQ || !anxietyScaleQ || !focusScaleQ || !calmBinaryQ || !focusOptionQ || !moodOptionQ || !anxietyOptionQ) {
    console.error('Could not find all required questions. Run the main seed first.')
    process.exit(1)
  }

  const DAYS = 30
  let created = 0, skippedDays = 0, alreadyExisted = 0

  for (let i = 0; i < DAYS; i++) {
    const daysAgo = DAYS - i // counts down from 30 to 1 (never seeds today)
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - daysAgo)
    const dateStr = date.toISOString().split('T')[0]

    const existing = await prisma.dailyQuiz.findUnique({
      where: { userId_date: { userId: user.id, date: dateStr } },
    })
    if (existing) {
      console.log(`  ${dateStr}: already exists`)
      alreadyExisted++
      continue
    }

    if (SKIP_INDICES.has(i)) {
      await prisma.dailyQuiz.create({
        data: {
          userId: user.id,
          date: dateStr,
          completed: true,
          skipped: true,
          questions: { connect: quickQs.map((q) => ({ id: q.id })) },
        },
      })
      console.log(`  ${dateStr}: skipped`)
      skippedDays++
      continue
    }

    // Trend parameter: 0 (oldest) → 1 (most recent)
    const t = i / (DAYS - 1)
    const dow = date.getUTCDay()
    const isWeekend = dow === 0 || dow === 6
    // Mid-period dip (days 10-14) makes the trend more interesting
    const midDip = i >= 10 && i <= 14 ? -0.45 : 0

    const moodVal = Math.min(5, Math.max(1, Math.round(
      2.8 + t * 1.2 + midDip + (isWeekend ? 0.35 : 0) + (sr(i, 1) - 0.5) * 1.6
    )))
    const anxietyVal = Math.min(5, Math.max(1, Math.round(
      4.1 - t * 1.0 - (isWeekend ? 0.45 : 0) + (sr(i, 2) - 0.5) * 1.4
    )))
    const focusVal = Math.min(5, Math.max(1, Math.round(
      2.6 + t * 1.1 + (isWeekend ? -0.25 : 0.1) + (sr(i, 3) - 0.5) * 1.4
    )))

    const calmAnswer =
      anxietyVal <= 2 ? 'Yes'
      : anxietyVal === 3 ? (sr(i, 4) > 0.4 ? 'Yes' : 'No')
      : sr(i, 5) > 0.8 ? 'Yes' : 'No'

    const focusAnswer = focusVal >= 4 ? 'Yes' : focusVal === 3 ? 'Mostly' : 'No'
    const moodAnswer  = moodVal  >= 4 ? 'Positive' : moodVal  >= 3 ? 'Mixed' : 'Negative'
    const anxietyAnswer = anxietyVal <= 2 ? 'Not at all' : anxietyVal <= 3 ? 'A little' : 'A lot'

    const quiz = await prisma.dailyQuiz.create({
      data: {
        userId: user.id,
        date: dateStr,
        completed: true,
        skipped: false,
        questions: { connect: quickQs.map((q) => ({ id: q.id })) },
      },
    })

    await prisma.quizResponse.createMany({
      data: [
        { quizId: quiz.id, questionId: moodScaleQ.id,     answer: String(moodVal),     skipped: false },
        { quizId: quiz.id, questionId: anxietyScaleQ.id,  answer: String(anxietyVal),  skipped: false },
        { quizId: quiz.id, questionId: focusScaleQ.id,    answer: String(focusVal),    skipped: false },
        { quizId: quiz.id, questionId: calmBinaryQ.id,    answer: calmAnswer,          skipped: false },
        { quizId: quiz.id, questionId: focusOptionQ.id,   answer: focusAnswer,         skipped: false },
        { quizId: quiz.id, questionId: moodOptionQ.id,    answer: moodAnswer,          skipped: false },
        { quizId: quiz.id, questionId: anxietyOptionQ.id, answer: anxietyAnswer,       skipped: false },
      ],
    })

    console.log(`  ${dateStr}: mood=${moodVal} anxiety=${anxietyVal} focus=${focusVal}`)
    created++
  }

  console.log(`\nHistory seed complete: ${created} created, ${skippedDays} skipped days, ${alreadyExisted} already existed`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
