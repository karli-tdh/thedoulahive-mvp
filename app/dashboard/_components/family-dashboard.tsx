'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { Baby, MagnifyingGlass, VideoCamera } from '@phosphor-icons/react'
import { ConnectionsRealtime } from './connections-realtime'
import type { FamilyDashboardData, FamilyConnection } from '../page'

// MuxPlayer — SSR off
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

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

// ── Portrait thumbnail with inline play ──────────────────────────────────────

function PortraitVideo({ playbackId, alt }: { playbackId: string | null; alt: string }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '9/16' }}>
      {playing && playbackId ? (
        <div className="absolute inset-0">
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
            autoPlay
            style={{ width: '100%', height: '100%' }}
            accentColor="#FE7040"
          />
        </div>
      ) : playbackId ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play ${alt}`}
        >
          <Image
            src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=0&width=480&fit_mode=smartcrop&height=853`}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cotton shadow-lg ring-2 ring-dark-green/20 transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 translate-x-0.5 text-dark-green" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-cotton">
          <VideoCamera size={48} weight="duotone" className="text-dark-green/20" aria-hidden />
        </div>
      )}
    </div>
  )
}

// ── Active conversation card ──────────────────────────────────────────────────

function ActiveCard({ conn, userId }: { conn: FamilyConnection; userId: string }) {
  const turn = turnLabel(conn.last_message_sender_id, userId, conn.doula_name)

  return (
    <article className="flex flex-col rounded-2xl border-2 border-dark-green bg-cotton overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-[2px_2px_0px_#07403B] hover:shadow-[4px_4px_0px_#07403B]">

      <PortraitVideo
        playbackId={conn.doula_video_id}
        alt={conn.doula_name ? `${conn.doula_name} intro video` : 'Doula intro video'}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">

        <p className="font-arinoe text-lg font-bold text-dark-green">
          {conn.doula_name ?? 'Doula'}
        </p>

        {/* Status pill */}
        <div className="flex flex-wrap gap-1.5">
          {turn.yours ? (
            <span className="rounded-full bg-[#FE7040] px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              {turn.label}
            </span>
          ) : (
            <span className="rounded-full bg-olive px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
              {turn.label}
            </span>
          )}
        </div>

        {/* Open conversation — pushed to bottom */}
        <div className="mt-auto pt-3">
          <Link
            href={`/dashboard/${conn.id}`}
            className="block w-full rounded-full bg-dark-green py-2.5 text-center text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-[#F55CB1]"
          >
            Open conversation
          </Link>
        </div>

      </div>
    </article>
  )
}

// ── Pending conversation card ─────────────────────────────────────────────────

function PendingCard({ conn }: { conn: FamilyConnection }) {
  const firstName = doulaFirstName(conn.doula_name)

  return (
    <article className="flex flex-col rounded-2xl border-2 border-dark-green bg-cotton overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-[2px_2px_0px_#07403B] hover:shadow-[4px_4px_0px_#07403B]">

      <PortraitVideo
        playbackId={conn.doula_video_id}
        alt={conn.doula_name ? `${conn.doula_name} intro video` : 'Doula intro video'}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">

        <p className="font-arinoe text-lg font-bold text-dark-green">
          {conn.doula_name ?? 'Doula'}
        </p>

        {/* Pending status pill */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#90EBD2] px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green">
            Waiting for {firstName} to accept
          </span>
        </div>

        {/* View profile — pushed to bottom */}
        <div className="mt-auto pt-3">
          <Link
            href={`/doulas/${conn.doula_profile_id}`}
            className="block w-full rounded-full bg-dark-green py-2.5 text-center text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-[#F55CB1]"
          >
            View profile
          </Link>
        </div>

      </div>
    </article>
  )
}

// ── Declined card ─────────────────────────────────────────────────────────────

function DeclinedCard({ conn }: { conn: FamilyConnection }) {
  return (
    <div className="rounded-xl border-2 border-dark-green/20 bg-cotton p-5 opacity-60">
      <p className="font-arinoe text-lg text-dark-green">{conn.doula_name ?? 'Doula'}</p>
      {conn.doula_location && (
        <p className="mt-0.5 text-sm font-abel text-muted-foreground">{conn.doula_location}</p>
      )}
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
        <MagnifyingGlass size={20} weight="duotone" className="shrink-0 text-dark-green" aria-hidden />
        <h3 className="font-arinoe text-xl text-dark-green">Keep Browsing</h3>
      </div>
      <p className="text-sm font-abel text-dark-green/80 leading-relaxed">
        The right doula is out there. Watch a few more videos and see who feels right.
      </p>
      <Link
        href="/doulas"
        className="inline-block rounded-full bg-dark-green px-5 py-2 text-sm font-abel font-bold text-cotton transition-colors duration-200 hover:bg-[#F55CB1]"
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
        <Baby size={24} weight="duotone" className="shrink-0 text-dark-green" aria-hidden />
        <h3 className="font-arinoe text-xl text-dark-green">Your Profile</h3>
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

// ── Honeycomb badge ───────────────────────────────────────────────────────────

function HexBadge({ count, fill, textClass }: {
  count:     number
  fill:      string
  textClass: string
}) {
  if (count === 0) return null
  return (
    <span className="relative inline-flex h-[24px] w-[21px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 980.68 1080" className="absolute inset-0 h-full w-full" aria-hidden>
        <path
          fill={fill}
          d="M884.66,265.76L523.27,57.11c-23.22-13.41-51.83-13.41-75.06,0L86.82,265.76
             c-23.22,13.41-37.53,38.19-37.53,65v417.3c0,26.82,14.31,51.59,37.53,65
             l361.4,208.65c23.22,13.41,51.83,13.41,75.06,0l361.39-208.65
             c23.22-13.41,37.53-38.19,37.53-65v-417.3
             c0-26.81-14.31-51.59-37.53-65Z"
        />
      </svg>
      <span className={`relative text-[10px] font-abel font-bold leading-none ${textClass}`}>
        {count > 9 ? '9+' : count}
      </span>
    </span>
  )
}

// ── Tinted empty state block ─────────────────────────────────────────────────

function EmptyState({
  children,
  tint = 'orange',
}: {
  children: React.ReactNode
  tint?: 'orange' | 'blue'
}) {
  const bg =
    tint === 'blue'
      ? 'rgba(144, 235, 210, 0.12)'
      : 'rgba(254, 112, 64, 0.10)'
  return (
    <div className="rounded-xl px-6 py-10 text-center" style={{ background: bg }}>
      {children}
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

  const yourTurnCount = active.filter(
    (c) => c.last_message_sender_id !== null && c.last_message_sender_id !== userId
  ).length

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

            {/* ── Pending Connections ───────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-arinoe text-2xl" style={{ color: '#90EBD2' }}>
                Pending Connections
                <HexBadge count={pending.length} fill="#90EBD2" textClass="text-dark-green" />
              </h2>
              {pending.length === 0 ? (
                <EmptyState tint="blue">
                  <p className="text-sm font-abel font-medium text-dark-green/60">
                    No pending connections yet.
                  </p>
                </EmptyState>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {pending.map((conn) => (
                    <PendingCard key={conn.id} conn={conn} />
                  ))}
                </div>
              )}
            </section>

            {/* ── Active Conversations ──────────────────────────────────────── */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-arinoe text-2xl text-brand-orange">
                Active Conversations
                <HexBadge count={yourTurnCount} fill="#FE7040" textClass="text-cotton" />
              </h2>
              {active.length === 0 ? (
                <EmptyState tint="orange">
                  {anyConnections ? (
                    <p className="text-sm font-abel font-medium text-dark-green/60">
                      No active conversations yet — hopefully soon!
                    </p>
                  ) : (
                    <>
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
                    </>
                  )}
                </EmptyState>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {active.map((conn) => (
                    <ActiveCard key={conn.id} conn={conn} userId={userId} />
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
