'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { ConnectionsRealtime } from './connections-realtime'
import type { DoulaDashboardData, DoulaConnection } from '../page'

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('en-GB', { month: 'short', year: 'numeric' })
}

function turnLabel(
  lastSenderId: string | null,
  currentUserId: string,
  otherName: string | null
): { label: string; yours: boolean } {
  const other = otherName ?? 'family'
  if (!lastSenderId) return { label: 'Your turn', yours: true }
  if (lastSenderId === currentUserId) return { label: `Waiting on ${other}`, yours: false }
  return { label: 'Your turn', yours: true }
}

// ── Pending request card ──────────────────────────────────────────────────────

function PendingCard({ conn }: { conn: DoulaConnection }) {
  const router = useRouter()
  const [expanded, setExpanded]      = useState(false)
  const [declining, setDeclining]    = useState(false)
  const [isPending, startTransition] = useTransition()

  const dueDate     = formatDueDate(conn.due_date)
  const textPreview = conn.what_they_want?.slice(0, 160) ?? null
  const textFull    = conn.what_they_want ?? null
  const needsMore   = (conn.what_they_want?.length ?? 0) > 160

  async function respond(status: 'accepted' | 'declined') {
    const supabase = createClient()
    const { data } = await supabase.rpc('respond_to_connection', {
      p_connection_id: conn.id,
      p_status:        status,
    })
    if (data && typeof data === 'object' && 'error' in data) {
      console.error('[respond_to_connection]', data.error)
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <article className="card-hover rounded-xl border-2 border-dark-green bg-card overflow-hidden">

      {/* Family intro video */}
      {conn.family_video_id && (
        <div className="border-b-2 border-dark-green/30">
          <VideoPlayer playbackId={conn.family_video_id} />
        </div>
      )}

      <div className="p-5 space-y-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <p className="font-arinoe text-xl text-dark-green">
            {conn.family_name ?? 'A family'}
          </p>
          <span className="shrink-0 text-xs font-abel text-muted-foreground">
            {daysAgo(conn.initiated_at)}
          </span>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-2">
          {dueDate && (
            <span className="rounded-full bg-soft-yellow/60 border border-soft-yellow px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green">
              Due {dueDate}
            </span>
          )}
          {conn.birth_setting && (
            <span className="rounded-full bg-light-blue/30 border border-light-blue px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green">
              {conn.birth_setting}
            </span>
          )}
        </div>

        {/* Reaction note */}
        {conn.reaction_note && (
          <blockquote className="border-l-4 border-light-pink pl-3 text-sm font-abel italic text-dark-green/70">
            &ldquo;{conn.reaction_note}&rdquo;
          </blockquote>
        )}

        {/* What they want */}
        {textFull && (
          <div>
            <p className="text-sm font-abel text-dark-green/80">
              {expanded || !needsMore ? textFull : `${textPreview}…`}
            </p>
            {needsMore && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-1 text-xs font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green"
              >
                View more
              </button>
            )}
          </div>
        )}

        {/* Expanded pregnancy notes */}
        {expanded && conn.pregnancy_notes && (
          <div className="rounded-xl bg-muted/60 border border-dark-green/20 p-3">
            <p className="mb-1 flex items-center gap-1 text-xs font-abel font-medium text-muted-foreground">
              <span>🔒</span> Private
            </p>
            <p className="text-sm font-abel text-dark-green/80">{conn.pregnancy_notes}</p>
          </div>
        )}

        {expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green"
          >
            Show less
          </button>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {declining ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-abel text-dark-green">Are you sure?</p>
              <button
                type="button"
                disabled={isPending}
                onClick={() => respond('declined')}
                className="rounded-lg bg-dark-green px-3 py-1.5 text-xs font-abel font-medium text-cotton hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {isPending ? 'Declining…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setDeclining(false)}
                className="text-xs font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => respond('accepted')}
                className="rounded-lg bg-dark-green px-4 py-2 text-sm font-abel font-medium text-cotton hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Start conversation'}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeclining(true)}
                className="rounded-lg border-2 border-dark-green px-4 py-2 text-sm font-abel font-medium text-dark-green hover:bg-light-pink/20 transition-colors disabled:opacity-50"
              >
                Not available
              </button>
            </>
          )}
        </div>

      </div>
    </article>
  )
}

// ── Active connection row ─────────────────────────────────────────────────────

function ActiveRow({ conn, userId }: { conn: DoulaConnection; userId: string }) {
  const dueDate = formatDueDate(conn.due_date)
  const turn    = turnLabel(conn.last_message_sender_id, userId, conn.family_name)

  return (
    <div className="card-hover flex items-center justify-between gap-4 rounded-xl border-2 border-dark-green bg-card px-5 py-4">
      <div className="min-w-0">
        <p className="font-arinoe text-lg text-dark-green truncate">
          {conn.family_name ?? 'A family'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {dueDate && (
            <span className="text-xs font-abel text-muted-foreground">Due {dueDate}</span>
          )}
          {conn.birth_setting && (
            <span className="rounded-full bg-light-blue/20 px-2 py-0.5 text-xs font-abel text-dark-green">
              {conn.birth_setting}
            </span>
          )}
          <span className={`text-xs font-abel font-medium ${turn.yours ? 'text-olive' : 'text-muted-foreground'}`}>
            {turn.label}
          </span>
        </div>
      </div>
      <Link
        href={`/dashboard/${conn.id}`}
        className="shrink-0 rounded-lg bg-dark-green px-3 py-1.5 text-xs font-abel font-medium text-cotton hover:opacity-80 transition-opacity"
      >
        Open conversation
      </Link>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DoulaDashboard({
  data,
  userId,
  saved,
}: {
  data: DoulaDashboardData
  userId: string
  saved: boolean
}) {
  const pending = data.connections.filter((c) => c.status === 'pending')
  const active  = data.connections.filter((c) => c.status === 'accepted')

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <ConnectionsRealtime profileField="doula_id" profileId={data.doula_profile_id} />

      <div className="space-y-8">

        {/* Profile-saved banner */}
        {saved && (
          <div className="rounded-xl border-2 border-dark-green bg-soft-yellow/60 px-6 py-4 text-center">
            <p className="text-sm font-abel text-dark-green">
              Your profile is saved. Go live whenever you&apos;re ready.
            </p>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="font-arinoe text-4xl text-dark-green">Dashboard</h1>
          {!data.is_published && (
            <p className="mt-2 text-sm font-abel text-muted-foreground">
              Your profile isn&apos;t published yet —{' '}
              <Link href="/onboarding/doula" className="underline underline-offset-4 hover:text-dark-green">
                complete your profile
              </Link>{' '}
              to appear in search.
            </p>
          )}
        </div>

        {/* ── Pending requests ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 font-arinoe text-2xl text-dark-green flex items-center gap-2">
            Connection requests
            {pending.length > 0 && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-popping-pink text-[11px] font-abel font-bold text-white">
                {pending.length}
              </span>
            )}
          </h2>

          {pending.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-dark-green/30 bg-muted/30 px-6 py-10 text-center">
              <p className="text-sm font-abel font-medium text-dark-green">No connection requests yet.</p>
              {!data.is_published && (
                <p className="mt-2 text-sm font-abel text-muted-foreground">
                  You&apos;ll only appear in search once your profile is published.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {pending.map((conn) => (
                <PendingCard key={conn.id} conn={conn} />
              ))}
            </div>
          )}
        </section>

        {/* ── Active conversations ────────────────────────────────────────── */}
        {active.length > 0 && (
          <section>
            <h2 className="mb-4 font-arinoe text-2xl text-dark-green">Active conversations</h2>
            <div className="space-y-3">
              {active.map((conn) => (
                <ActiveRow key={conn.id} conn={conn} userId={userId} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
