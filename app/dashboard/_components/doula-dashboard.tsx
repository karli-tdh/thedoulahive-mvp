'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarBlank, MapPin, Star, Users } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { ConnectionsRealtime } from './connections-realtime'
import { GoLiveGate } from './go-live-gate'
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

/**
 * Takes a family's full_name ("Sarah Smith") and returns "Smith Family".
 * Falls back to "A Family" if name is null or single-word.
 */
function familyDisplayName(fullName: string | null): string {
  if (!fullName) return 'A Family'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  return `${parts[parts.length - 1]} Family`
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

  const displayName = familyDisplayName(conn.family_name)
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
    <article className="card-hover rounded-xl border-2 border-dark-green bg-cotton overflow-hidden">

      {/* Family intro video */}
      {conn.family_video_id && (
        <div className="border-b-2 border-dark-green/30">
          <VideoPlayer playbackId={conn.family_video_id} />
        </div>
      )}

      <div className="p-5 space-y-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <p className="font-arinoe text-xl text-dark-green">{displayName}</p>
          <span className="shrink-0 text-xs font-abel text-muted-foreground">
            {daysAgo(conn.initiated_at)}
          </span>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-2">
          {dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#90EBD2] px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green">
              <CalendarBlank size={11} weight="duotone" aria-hidden />
              Due {dueDate}
            </span>
          )}
          {conn.birth_setting && (
            <span className="inline-flex items-center gap-1 rounded-full bg-dark-green px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              <MapPin size={11} weight="duotone" aria-hidden />
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
                className="rounded-full bg-dark-green px-4 py-1.5 text-xs font-abel font-medium text-cotton hover:opacity-80 transition-opacity disabled:opacity-50"
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
                className="rounded-full bg-dark-green px-5 py-2 text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-popping-pink disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Start conversation'}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeclining(true)}
                className="rounded-full border-2 border-dark-green px-5 py-2 text-sm font-abel font-medium text-dark-green transition-colors duration-200 hover:bg-dark-green hover:text-cotton disabled:opacity-50"
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
  const displayName = familyDisplayName(conn.family_name)
  const dueDate     = formatDueDate(conn.due_date)
  const turn        = turnLabel(conn.last_message_sender_id, userId, conn.family_name)

  return (
    <div className="card-hover flex items-center justify-between gap-4 rounded-xl border-2 border-dark-green bg-cotton px-5 py-4">
      <div className="min-w-0">
        <p className="font-arinoe text-lg text-dark-green truncate">{displayName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {dueDate && (
            <span className="text-xs font-abel text-muted-foreground">Due {dueDate}</span>
          )}
          {conn.birth_setting && (
            <span className="rounded-full bg-dark-green px-2.5 py-0.5 text-xs font-abel text-cotton">
              {conn.birth_setting}
            </span>
          )}
          {turn.yours ? (
            <span className="rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              {turn.label}
            </span>
          ) : (
            <span className="text-xs font-abel text-muted-foreground">{turn.label}</span>
          )}
        </div>
      </div>
      <Link
        href={`/dashboard/${conn.id}`}
        className="shrink-0 rounded-full bg-dark-green px-4 py-1.5 text-xs font-abel font-medium text-cotton hover:opacity-80 transition-opacity"
      >
        Open conversation
      </Link>
    </div>
  )
}

// ── Sidebar: Stats card ───────────────────────────────────────────────────────

function StatsCard({
  profileViewsWeek,
  totalConnections,
  doulaProfileId,
}: {
  profileViewsWeek: number
  totalConnections: number
  doulaProfileId:   string
}) {
  return (
    <div className="rounded-xl border-2 border-dark-green bg-cotton px-5 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <Star size={24} weight="duotone" className="shrink-0 text-dark-green" aria-hidden />
        <h3 className="font-arinoe text-xl text-dark-green">Highlights</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-abel text-dark-green/70">Profile views this week</span>
          <span className="font-arinoe text-2xl text-dark-green">{profileViewsWeek}</span>
        </div>
        <div className="border-t border-dark-green/10 pt-3 flex items-baseline justify-between gap-2">
          <span className="text-sm font-abel text-dark-green/70">Total connections</span>
          <span className="font-arinoe text-2xl text-dark-green">{totalConnections}</span>
        </div>
      </div>
      <Link
        href={`/doulas/${doulaProfileId}`}
        className="mt-1 inline-block text-xs font-abel text-dark-green underline underline-offset-4 hover:text-popping-pink transition-colors"
      >
        Preview your profile →
      </Link>
    </div>
  )
}

// ── Sidebar: Circle Community card ───────────────────────────────────────────

function CommunityCard() {
  return (
    <div className="rounded-xl border-2 border-dark-green bg-cotton px-5 py-5 space-y-3">
      <div className="flex items-center gap-2">
        <Users size={20} weight="duotone" className="shrink-0 text-dark-green" aria-hidden />
        <h3 className="font-arinoe text-xl text-dark-green">The Hive</h3>
      </div>
      <p className="text-sm font-abel text-dark-green/80 leading-relaxed">
        A space for doulas doing the work. Talk honestly about the realities of this work, stay
        connected, and share feedback with Tif &amp; Karli who are building The Doula Hive!
      </p>
      <Link
        href="https://thedoulahive.circle.so/c/doula-life/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full bg-dark-green px-5 py-2 text-sm font-abel font-bold text-cotton transition-colors hover:bg-popping-pink hover:text-cotton"
      >
        To The Hive
      </Link>
    </div>
  )
}

// ── Empty state block ─────────────────────────────────────────────────────────

function EmptyState({
  children,
  tint = 'olive',
}: {
  children: React.ReactNode
  tint?: 'olive' | 'orange'
}) {
  const bg =
    tint === 'orange'
      ? 'rgba(254, 112, 64, 0.10)'   // brand-orange 10%
      : 'rgba(149, 167, 51, 0.10)'   // olive 10%
  return (
    <div className="rounded-xl px-6 py-10 text-center" style={{ background: bg }}>
      {children}
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
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
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
          <h1 className="font-arinoe text-4xl text-dark-green">
            Welcome to your Dashboard{data.first_name ? `, ${data.first_name}` : ''}
          </h1>
        </div>

        {/* Go Live gate — full width */}
        <GoLiveGate
          doulaProfileId={data.doula_profile_id}
          circleVerified={data.circle_verified}
          isPublished={data.is_published}
        />

        {/* ── Two-column grid ──────────────────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Main column (2/3) ──────────────────────────────────────────── */}
          <div className="space-y-8 lg:col-span-2">

            {/* Connection requests */}
            <section>
              <h2 className="mb-4 font-arinoe text-2xl text-olive flex items-center gap-2">
                Connection requests
                {pending.length > 0 && (
                  <span className="relative inline-flex h-[22px] w-[20px] shrink-0 items-center justify-center">
                    <svg viewBox="0 0 980.68 1080" className="absolute inset-0 h-full w-full" aria-hidden>
                      <path
                        fill="#F55CB1"
                        d="M884.66,265.76L523.27,57.11c-23.22-13.41-51.83-13.41-75.06,0L86.82,265.76
                           c-23.22,13.41-37.53,38.19-37.53,65v417.3c0,26.82,14.31,51.59,37.53,65
                           l361.4,208.65c23.22,13.41,51.83,13.41,75.06,0l361.39-208.65
                           c23.22-13.41,37.53-38.19,37.53-65v-417.3
                           c0-26.81-14.31-51.59-37.53-65Z"
                      />
                    </svg>
                    <span className="relative text-[10px] font-abel font-bold leading-none text-cotton">
                      {pending.length > 9 ? '9+' : pending.length}
                    </span>
                  </span>
                )}
              </h2>

              {pending.length === 0 ? (
                <EmptyState tint="olive">
                  <p className="text-sm font-abel font-medium text-dark-green/60">
                    No requests just yet.
                  </p>
                  {!data.is_published && (
                    <p className="mt-2 text-sm font-abel text-muted-foreground">
                      You&apos;ll only appear in search once your profile is published.
                    </p>
                  )}
                </EmptyState>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {pending.map((conn) => (
                    <PendingCard key={conn.id} conn={conn} />
                  ))}
                </div>
              )}
            </section>

            {/* Active conversations */}
            <section>
              <h2 className="mb-4 font-arinoe text-2xl text-brand-orange">
                Active conversations
              </h2>
              {active.length === 0 ? (
                <EmptyState tint="orange">
                  <p className="text-sm font-abel font-medium text-dark-green/60">
                    No conversations yet — they&apos;ll appear here once you accept a connection request.
                  </p>
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {active.map((conn) => (
                    <ActiveRow key={conn.id} conn={conn} userId={userId} />
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* ── Sidebar (1/3) ──────────────────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-1">
            <StatsCard
              profileViewsWeek={data.profile_views_week}
              totalConnections={active.length}
              doulaProfileId={data.doula_profile_id}
            />
            <CommunityCard />
          </div>

        </div>

      </div>
    </main>
  )
}
