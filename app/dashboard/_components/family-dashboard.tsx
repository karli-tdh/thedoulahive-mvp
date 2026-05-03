'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { ConnectionsRealtime } from './connections-realtime'
import type { FamilyDashboardData, FamilyConnection } from '../page'

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function turnLabel(
  lastSenderId: string | null,
  currentUserId: string,
  doulaName: string | null
): { label: string; yours: boolean } {
  const doula = doulaName ?? 'your doula'
  if (!lastSenderId) return { label: `Waiting on ${doula}`, yours: false }
  if (lastSenderId === currentUserId) return { label: `Waiting on ${doula}`, yours: false }
  return { label: 'Your turn', yours: true }
}

// ── Pending card ──────────────────────────────────────────────────────────────

function PendingCard({ conn }: { conn: FamilyConnection }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">

      {/* Doula thumbnail/video placeholder */}
      {conn.doula_video_id && (
        <div className="border-b border-border">
          <VideoPlayer playbackId={conn.doula_video_id} />
        </div>
      )}

      <div className="p-5 space-y-3">

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{conn.doula_name ?? 'Doula'}</p>
            {conn.doula_location && (
              <p className="text-sm text-muted-foreground">{conn.doula_location}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Request sent
          </span>
        </div>

        {conn.doula_tagline && (
          <p className="text-sm text-foreground/80 line-clamp-2">{conn.doula_tagline}</p>
        )}

        {conn.reaction_note && (
          <blockquote className="border-l-2 border-border pl-3 text-sm italic text-muted-foreground">
            &ldquo;{conn.reaction_note}&rdquo;
          </blockquote>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground">
            Conversation requested · {daysAgo(conn.initiated_at)}
          </p>
          <Link
            href={`/doulas/${conn.doula_profile_id}`}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            View profile
          </Link>
        </div>

      </div>
    </div>
  )
}

// ── Active connection row ─────────────────────────────────────────────────────

function ActiveRow({
  conn,
  userId,
}: {
  conn: FamilyConnection
  userId: string
}) {
  const turn = turnLabel(conn.last_message_sender_id, userId, conn.doula_name)

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">
          {conn.doula_name ?? 'Doula'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {conn.doula_location && (
            <span className="text-xs text-muted-foreground">{conn.doula_location}</span>
          )}
          <span
            className={`text-xs font-medium ${
              turn.yours ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {turn.label}
          </span>
        </div>
      </div>
      <Link
        href={`/dashboard/${conn.id}`}
        className="shrink-0 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
      >
        Open conversation
      </Link>
    </div>
  )
}

// ── Declined card ─────────────────────────────────────────────────────────────

function DeclinedCard({ conn }: { conn: FamilyConnection }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5 opacity-60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{conn.doula_name ?? 'Doula'}</p>
          {conn.doula_location && (
            <p className="text-sm text-muted-foreground">{conn.doula_location}</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Not available — you can send a request to another doula anytime.
      </p>
      <div className="mt-4">
        <Link
          href="/doulas"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Browse doulas
        </Link>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function FamilyDashboard({
  data,
  userId,
}: {
  data: FamilyDashboardData
  userId: string
}) {
  const router = useRouter()
  const pending  = data.connections.filter((c) => c.status === 'pending')
  const active   = data.connections.filter((c) => c.status === 'accepted')
  const declined = data.connections.filter((c) => c.status === 'declined')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (data.connections.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6">
        <ConnectionsRealtime profileField="family_id" profileId={data.family_profile_id} />

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Log out
            </button>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">No connections yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse doulas and send a connection request when you find a good fit.
            </p>
            <div className="mt-6">
              <Link
                href="/doulas"
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
              >
                Browse doulas
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Normal view ─────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <ConnectionsRealtime profileField="family_id" profileId={data.family_profile_id} />

      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Log out
          </button>
        </div>

        {/* ── Active conversations ────────────────────────────────────────── */}
        {active.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Your conversations</h2>
            <div className="space-y-3">
              {active.map((conn) => (
                <ActiveRow key={conn.id} conn={conn} userId={userId} />
              ))}
            </div>
          </section>
        )}

        {/* ── Pending ─────────────────────────────────────────────────────── */}
        {pending.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Requests sent</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {pending.map((conn) => (
                <PendingCard key={conn.id} conn={conn} />
              ))}
            </div>
          </section>
        )}

        {/* ── Declined ────────────────────────────────────────────────────── */}
        {declined.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">Not available</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {declined.map((conn) => (
                <DeclinedCard key={conn.id} conn={conn} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
