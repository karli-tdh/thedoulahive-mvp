'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Baby, MagnifyingGlass, VideoCamera } from '@phosphor-icons/react'
import { ConnectionsRealtime } from './connections-realtime'
import type { FamilyDashboardData, FamilyConnection } from '../page'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
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

function doulaFirstName(fullName: string | null): string {
  if (!fullName) return 'your doula'
  return fullName.trim().split(/\s+/)[0]
}

// ── Shared thumbnail block ────────────────────────────────────────────────────

function VideoThumbnail({ playbackId, alt }: { playbackId: string | null; alt: string }) {
  if (playbackId) {
    return (
      <div className="relative h-[75px] w-[100px] shrink-0 overflow-hidden rounded-lg">
        <Image
          src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`}
          alt={alt}
          fill
          className="object-cover"
          sizes="100px"
        />
      </div>
    )
  }
  return (
    <div className="flex h-[75px] w-[100px] shrink-0 items-center justify-center rounded-lg bg-cotton">
      <VideoCamera size={24} weight="duotone" className="text-dark-green/30" aria-hidden />
    </div>
  )
}

// ── Active conversation row ───────────────────────────────────────────────────

function ActiveRow({ conn, userId }: { conn: FamilyConnection; userId: string }) {
  const turn = turnLabel(conn.last_message_sender_id, userId, conn.doula_name)

  return (
    <div className="card-hover flex items-center gap-4 rounded-xl border-2 border-dark-green bg-cotton px-4 py-3">

      <VideoThumbnail
        playbackId={conn.doula_video_id}
        alt={conn.doula_name ? `${conn.doula_name} intro video` : 'Doula intro video'}
      />

      <div className="min-w-0 flex-1">
        <p className="font-arinoe text-lg text-dark-green truncate">
          {conn.doula_name ?? 'Doula'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {conn.doula_location && (
            <span className="rounded-full bg-dark-green px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              {conn.doula_location}
            </span>
          )}
          {turn.yours ? (
            <span className="rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              {turn.label}
            </span>
          ) : (
            <span className="rounded-full bg-olive px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              {turn.label}
            </span>
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

// ── Pending conversation row ──────────────────────────────────────────────────

function PendingRow({ conn }: { conn: FamilyConnection }) {
  const firstName = doulaFirstName(conn.doula_name)

  return (
    <div className="card-hover flex items-center gap-4 rounded-xl border-2 border-dark-green bg-cotton px-4 py-3">

      <VideoThumbnail
        playbackId={conn.doula_video_id}
        alt={conn.doula_name ? `${conn.doula_name} intro video` : 'Doula intro video'}
      />

      <div className="min-w-0 flex-1">
        <p className="font-arinoe text-lg text-dark-green truncate">
          {conn.doula_name ?? 'Doula'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {conn.doula_location && (
            <span className="rounded-full bg-dark-green px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              {conn.doula_location}
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green"
            style={{ background: '#90EBD2' }}
          >
            Waiting for {firstName} to accept
          </span>
        </div>
      </div>

      <Link
        href={`/doulas/${conn.doula_profile_id}`}
        className="shrink-0 text-xs font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green transition-colors"
      >
        View profile
      </Link>

    </div>
  )
}

// ── Declined card ─────────────────────────────────────────────────────────────

function DeclinedCard({ conn }: { conn: FamilyConnection }) {
  return (
    <div className="rounded-xl border-2 border-dark-green/20 bg-cotton p-5 opacity-60">
      <div>
        <p className="font-arinoe text-lg text-dark-green">{conn.doula_name ?? 'Doula'}</p>
        {conn.doula_location && (
          <p className="text-sm font-abel text-muted-foreground">{conn.doula_location}</p>
        )}
      </div>
      <p className="mt-3 text-sm font-abel text-muted-foreground">
        Not available — you can send a request to another doula anytime.
      </p>
      <div className="mt-4">
        <Link
          href="/doulas"
          className="inline-flex items-center rounded-full border-2 border-dark-green px-4 py-1.5 text-sm font-abel font-medium text-dark-green hover:bg-dark-green hover:text-cotton transition-colors"
        >
          Browse doulas
        </Link>
      </div>
    </div>
  )
}

// ── Sidebar: Browse nudge card ────────────────────────────────────────────────

function BrowseCard() {
  return (
    <div className="rounded-xl border-2 border-dark-green bg-cotton px-5 py-5 space-y-3">
      <div className="flex items-center gap-2">
        <MagnifyingGlass size={20} weight="duotone" className="shrink-0 text-olive" aria-hidden />
        <h3 className="font-arinoe text-xl text-olive">Keep Browsing</h3>
      </div>
      <p className="text-sm font-abel text-dark-green/80 leading-relaxed">
        The right doula is out there. Watch a few more videos and see who feels right.
      </p>
      <Link
        href="/doulas"
        className="inline-block rounded-full bg-dark-green px-5 py-2 text-sm font-abel font-bold text-cotton transition-colors hover:bg-olive hover:text-cotton"
      >
        Browse doulas →
      </Link>
    </div>
  )
}

// ── Sidebar: Profile summary card ─────────────────────────────────────────────

function ProfileCard({
  dueDate,
  birthSetting,
}: {
  dueDate:      string | null
  birthSetting: string | null
}) {
  const formattedDue = formatDueDate(dueDate)

  return (
    <div className="rounded-xl border-2 border-dark-green bg-cotton px-5 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <Baby size={24} weight="duotone" className="shrink-0 text-brand-orange" aria-hidden />
        <h3 className="font-arinoe text-xl text-brand-orange">Your Profile</h3>
      </div>
      <div className="space-y-2">
        {formattedDue && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-abel font-medium uppercase tracking-wide text-muted-foreground">
              Due date
            </span>
            <span className="text-sm font-abel text-dark-green">{formattedDue}</span>
          </div>
        )}
        {birthSetting && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-abel font-medium uppercase tracking-wide text-muted-foreground">
              Birth setting
            </span>
            <span className="text-sm font-abel text-dark-green">{birthSetting}</span>
          </div>
        )}
      </div>
      <Link
        href="/onboarding/family"
        className="inline-block text-xs font-abel text-dark-green underline underline-offset-4 hover:text-brand-orange transition-colors"
      >
        Edit your profile →
      </Link>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyConversations() {
  return (
    <div
      className="rounded-xl px-6 py-10 text-center"
      style={{ background: 'rgba(254, 112, 64, 0.10)' }}
    >
      <p className="text-sm font-abel font-medium text-dark-green/70">
        No conversations yet — find a doula whose video speaks to you and send them a note.
      </p>
      <div className="mt-5">
        <Link
          href="/doulas"
          className="inline-block rounded-full bg-dark-green px-5 py-2 text-sm font-abel font-bold text-cotton hover:opacity-80 transition-opacity"
        >
          Browse doulas →
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
  data:   FamilyDashboardData
  userId: string
}) {
  const active   = data.connections.filter((c) => c.status === 'accepted')
  const pending  = data.connections.filter((c) => c.status === 'pending')
  const declined = data.connections.filter((c) => c.status === 'declined')
  const anyConnections = active.length > 0 || pending.length > 0

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      <ConnectionsRealtime profileField="family_id" profileId={data.family_profile_id} />

      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-arinoe text-4xl text-dark-green">
            Welcome to your Dashboard{data.first_name ? `, ${data.first_name}` : ''}
          </h1>
        </div>

        {/* ── Two-column grid ──────────────────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Main column (2/3) ──────────────────────────────────────────── */}
          <div className="space-y-8 lg:col-span-2">

            {/* ── Pending Connections — only shown when doula hasn't accepted ── */}
            {pending.length > 0 && (
              <section>
                <h2 className="mb-4 font-arinoe text-2xl" style={{ color: '#90EBD2' }}>
                  Pending Connections
                </h2>
                <div className="space-y-3">
                  {pending.map((conn) => (
                    <PendingRow key={conn.id} conn={conn} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Active Conversations — only accepted connections ───────────── */}
            <section>
              <h2 className="mb-4 font-arinoe text-2xl text-brand-orange">
                Active Conversations
              </h2>
              {active.length === 0 ? (
                anyConnections ? (
                  <p className="text-sm font-abel text-dark-green/60 italic">
                    No active conversations yet — hopefully soon!
                  </p>
                ) : (
                  <EmptyConversations />
                )
              ) : (
                <div className="space-y-3">
                  {active.map((conn) => (
                    <ActiveRow key={conn.id} conn={conn} userId={userId} />
                  ))}
                </div>
              )}
            </section>

            {/* Not available */}
            {declined.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-abel font-medium text-muted-foreground">
                  Not available
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {declined.map((conn) => (
                    <DeclinedCard key={conn.id} conn={conn} />
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* ── Sidebar (1/3) ──────────────────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-1">
            <BrowseCard />
            <ProfileCard
              dueDate={data.due_date}
              birthSetting={data.birth_setting}
            />
          </div>

        </div>

      </div>
    </main>
  )
}
