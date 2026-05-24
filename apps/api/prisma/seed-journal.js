// Seeds realistic journal entries for xendke@gmail.com (idempotent)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const ENTRIES = [
  {
    daysAgo: 29,
    content:
      "Starting this journal to try to get a better handle on my own patterns. Felt anxious most of the day for no obvious reason. Hoping that writing things down helps me notice what's actually going on.",
  },
  {
    daysAgo: 27,
    content:
      "Better day today. Got outside for a walk and it actually helped. The fresh air thing is real — I keep forgetting that.",
  },
  {
    daysAgo: 24,
    content:
      "Couldn't sleep last night. Mind wouldn't stop cycling through everything I haven't done yet. Made a list this morning which helped a little. There's something about externalizing the chaos that makes it feel smaller.",
  },
  {
    daysAgo: 22,
    content:
      "Had coffee with a friend and we talked for hours. Realized I've been isolating myself more than I noticed. That's something to watch.",
  },
  {
    daysAgo: 19,
    content:
      "The dip is real this week. Everything feels heavier than it should. Trying not to spiral — just noticing it and keeping moving.",
  },
  {
    daysAgo: 17,
    content:
      "Meditation actually worked today. Sat for 15 minutes without checking my phone and felt genuinely calm afterward. Why don't I do this more often?",
  },
  {
    daysAgo: 15,
    content:
      "Difficult conversation with family today. Uncomfortable but necessary. Feeling a mix of relief and exhaustion. Sometimes the hard conversations are the ones that actually matter.",
  },
  {
    daysAgo: 12,
    content:
      "Started reading before bed instead of scrolling. Sleeping noticeably better. It's always the obvious things.",
  },
  {
    daysAgo: 12,
    hour: 21,
    content:
      "Finished the book I've been putting off for months. It ended up being exactly what I needed right now — funny how that works sometimes.",
  },
  {
    daysAgo: 9,
    content:
      "Rough morning, better afternoon. Learning to let a bad start not set the tone for the whole day. Progress, I think.",
  },
  {
    daysAgo: 7,
    content:
      "Long run today. Physical tiredness is so much easier to handle than mental tiredness. Body is worn out but the mind is quiet — I'll take it.",
  },
  {
    daysAgo: 5,
    content:
      "Three solid hours of focused work. No phone, no interruptions. I'd forgotten what that state feels like. Need to protect those windows better.",
  },
  {
    daysAgo: 3,
    content:
      "Small thing but I cooked an actual meal today instead of ordering delivery. It's a weird form of self-care but it counted.",
  },
  {
    daysAgo: 1,
    content:
      "Feeling more like myself lately. Hard to say exactly what shifted — maybe just time passing, maybe actually putting in the work. Probably both.",
  },
]

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'xendke@gmail.com' } })
  if (!user) {
    console.log('User xendke@gmail.com not found — skipping journal seed')
    return
  }

  const existing = await prisma.journalEntry.count({ where: { userId: user.id } })
  if (existing > 0) {
    console.log(`Journal entries already seeded (${existing} found) — skipping`)
    return
  }

  for (const { daysAgo, hour = 20, content } of ENTRIES) {
    const ts = new Date()
    ts.setUTCDate(ts.getUTCDate() - daysAgo)
    ts.setUTCHours(hour, 0, 0, 0)

    await prisma.journalEntry.create({
      data: { userId: user.id, content, createdAt: ts, updatedAt: ts },
    })
  }

  console.log(`Seeded ${ENTRIES.length} journal entries`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
