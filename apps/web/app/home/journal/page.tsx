import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getServerToken } from "@/lib/auth"
import { serverGql } from "@/lib/api.server"
import { Navbar } from "@/components/Navbar"
import { JournalFeed } from "@/components/JournalFeed"
import type { JournalEntry } from "@/types/journal"

export const metadata: Metadata = {
  title: "Journal — Forest",
}

const JOURNAL_QUERY = `query {
  me { firstName }
  journalEntries(limit: 200) { id content createdAt updatedAt }
}`

type JournalData = {
  me: { firstName: string | null } | null
  journalEntries: JournalEntry[]
}

export default async function JournalPage() {
  if (!getServerToken()) redirect("/")

  let me: { firstName: string | null } | null = null
  let entries: JournalEntry[] = []

  try {
    const data = await serverGql<JournalData>(JOURNAL_QUERY)
    me = data.me
    entries = data.journalEntries ?? []
  } catch {
    // Fetch failed — render with empty state
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(900px 600px at 12% -10%, rgba(34,192,106,0.18), transparent 60%),
          radial-gradient(1200px 700px at 110% 10%, rgba(34,192,106,0.10), transparent 55%),
          radial-gradient(800px 500px at 50% 110%, rgba(34,192,106,0.08), transparent 60%),
          #050807
        `,
      }}
    >
      <Navbar variant="app" firstName={me?.firstName} />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-7 pb-20">
        <div className="mt-[42px] mb-[26px]">
          <h1 className="text-[34px] font-bold tracking-[-0.03em] leading-tight">
            Journal
          </h1>
          <p
            className="mt-2 text-[14.5px] leading-[1.55]"
            style={{ color: "rgba(154,168,160,1)" }}
          >
            Your private space to reflect and think out loud.
          </p>
        </div>

        <JournalFeed initialEntries={entries} />
      </main>
    </div>
  )
}
