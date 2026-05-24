"use client"

import { useState, useRef, useEffect } from "react"
import { Pencil, Trash2, Plus, X, Check } from "lucide-react"
import { gql } from "@/lib/api"
import type { JournalEntry } from "@/types/journal"

const CREATE_ENTRY = `mutation CreateJournalEntry($content: String!) {
  createJournalEntry(content: $content) { id content createdAt updatedAt }
}`
const UPDATE_ENTRY = `mutation UpdateJournalEntry($id: Int!, $content: String!) {
  updateJournalEntry(id: $id, content: $content) { id content createdAt updatedAt }
}`
const DELETE_ENTRY = `mutation DeleteJournalEntry($id: Int!) {
  deleteJournalEntry(id: $id)
}`

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const yd = new Date(now)
  yd.setDate(yd.getDate() - 1)
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  if (d.toDateString() === now.toDateString()) return `Today · ${time}`
  if (d.toDateString() === yd.toDateString()) return `Yesterday · ${time}`
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` · ${time}`
  )
}

const cardStyle = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 60px -40px rgba(0,0,0,0.7)",
} as React.CSSProperties

function EntryCard({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: JournalEntry
  onUpdate: (updated: JournalEntry) => void
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(entry.content)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  const save = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (trimmed === entry.content) { setEditing(false); return }
    setSaving(true)
    try {
      const data = await gql<{ updateJournalEntry: JournalEntry }>(UPDATE_ENTRY, {
        id: entry.id,
        content: trimmed,
      })
      onUpdate(data.updateJournalEntry)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => { setEditing(false); setText(entry.content) }

  const del = async () => {
    setDeleting(true)
    try {
      await gql(DELETE_ENTRY, { id: entry.id })
      onDelete(entry.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className="rounded-[18px] p-[22px] relative overflow-hidden group" style={cardStyle}>
      <div
        className="absolute inset-0 pointer-events-none rounded-[18px]"
        style={{
          background: "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.03), transparent 50%)",
        }}
      />
      <div className="relative">
        {editing ? (
          <>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="w-full bg-transparent text-[15px] leading-[1.65] resize-none outline-none placeholder:text-[rgba(95,109,101,1)]"
              style={{ color: "rgba(220,232,224,1)" }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save()
                if (e.key === "Escape") cancel()
              }}
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={cancel}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full transition-colors hover:bg-white/[0.04]"
                style={{ color: "rgba(95,109,101,1)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !text.trim()}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full transition-opacity disabled:opacity-40"
                style={{
                  color: "#3ee07f",
                  background: "rgba(62,224,127,0.12)",
                  border: "1px solid rgba(62,224,127,0.2)",
                }}
              >
                <Check className="w-3 h-3" /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              className="text-[15px] leading-[1.65] whitespace-pre-wrap"
              style={{ color: "rgba(220,232,224,1)" }}
            >
              {entry.content}
            </p>
            <div className="flex items-center justify-between mt-[14px]">
              <span
                className="text-[11px]"
                style={{ fontFamily: "monospace", color: "rgba(95,109,101,1)" }}
              >
                {formatDate(entry.createdAt)}
              </span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(true)}
                  className="p-[6px] rounded-lg transition-colors hover:bg-white/[0.06]"
                  style={{ color: "rgba(95,109,101,1)" }}
                  aria-label="Edit entry"
                >
                  <Pencil className="w-[13px] h-[13px]" />
                </button>
                <button
                  onClick={del}
                  disabled={deleting}
                  className="p-[6px] rounded-lg transition-colors hover:bg-red-500/10 disabled:opacity-40"
                  style={{ color: "rgba(95,109,101,1)" }}
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-[13px] h-[13px]" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

interface JournalFeedProps {
  initialEntries: JournalEntry[]
}

export function JournalFeed({ initialEntries }: JournalFeedProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerText, setComposerText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (composerOpen && composerRef.current) composerRef.current.focus()
  }, [composerOpen])

  const submit = async () => {
    const trimmed = composerText.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const data = await gql<{ createJournalEntry: JournalEntry }>(CREATE_ENTRY, {
        content: trimmed,
      })
      setEntries([data.createJournalEntry, ...entries])
      setComposerText("")
      setComposerOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const closeComposer = () => { setComposerOpen(false); setComposerText("") }

  return (
    <div className="max-w-[720px]">
      {/* Composer */}
      {composerOpen ? (
        <div className="rounded-[18px] p-[22px] mb-5 relative overflow-hidden" style={cardStyle}>
          <div
            className="absolute inset-0 pointer-events-none rounded-[18px]"
            style={{
              background: "radial-gradient(120% 80% at 0% 0%, rgba(62,224,127,0.04), transparent 50%)",
            }}
          />
          <div className="relative">
            <div
              className="text-[11px] mb-3"
              style={{ fontFamily: "monospace", color: "rgba(95,109,101,1)" }}
            >
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" · "}
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
            <textarea
              ref={composerRef}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              className="w-full bg-transparent text-[15px] leading-[1.65] resize-none outline-none placeholder:text-[rgba(95,109,101,1)]"
              style={{ color: "rgba(220,232,224,1)" }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit()
                if (e.key === "Escape") closeComposer()
              }}
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={closeComposer}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full transition-colors hover:bg-white/[0.04]"
                style={{ color: "rgba(95,109,101,1)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !composerText.trim()}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full transition-opacity disabled:opacity-40"
                style={{
                  color: "#3ee07f",
                  background: "rgba(62,224,127,0.12)",
                  border: "1px solid rgba(62,224,127,0.2)",
                }}
              >
                <Check className="w-3 h-3" /> {submitting ? "Saving…" : "Save entry"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setComposerOpen(true)}
          className="flex items-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-full mb-5 transition-colors hover:bg-[rgba(62,224,127,0.15)]"
          style={{
            color: "#3ee07f",
            background: "rgba(62,224,127,0.10)",
            border: "1px solid rgba(62,224,127,0.18)",
          }}
        >
          <Plus className="w-4 h-4" />
          New entry
        </button>
      )}

      {/* Feed */}
      {entries.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px]" style={{ color: "rgba(95,109,101,1)" }}>
            No entries yet. Write your first one above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onUpdate={(updated) =>
                setEntries(entries.map((e) => (e.id === updated.id ? updated : e)))
              }
              onDelete={(id) => setEntries(entries.filter((e) => e.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
