'use client'

import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Link from 'next/link'
import { VideoCamera } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { VideoUploader } from '@/components/video/VideoUploader'
import type { ThreadData, ThreadMessage } from '../_types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)

  const day   = date.getDate()                                              // no leading zero
  const month = date.toLocaleString('en-GB', { month: 'short' })           // Jan, Feb…
  const year  = date.getFullYear()
  const time  = date.toLocaleString('en-GB', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(/\s?(AM|PM)/, (_, p) => p.toLowerCase())                      // 9:27am

  return `${day} ${month} ${year}, ${time}`
}

// ── Family context card (doula-only, pinned above messages) ──────────────────

function FamilyContextCard({
  videoId, reactionNote,
}: {
  videoId: string | null
  reactionNote: string | null
}) {
  if (!videoId && !reactionNote) return null

  return (
    <div className="rounded-xl border-2 border-dark-green bg-cotton overflow-hidden">
      {videoId && <VideoPlayer playbackId={videoId} />}
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-xs font-abel font-medium text-dark-green/70">
          Why they reached out
        </p>
        {reactionNote ? (
          <p className="text-sm font-abel text-dark-green/80">{reactionNote}</p>
        ) : (
          <p className="text-sm font-abel italic text-muted-foreground">No message left.</p>
        )}
      </div>
    </div>
  )
}

// ── Message cards ─────────────────────────────────────────────────────────────

function VideoMessageCard({ msg }: { msg: ThreadMessage }) {
  return (
    <div className={`rounded-xl border-2 bg-cotton overflow-hidden ${msg.is_mine ? 'border-dark-green' : 'border-dark-green/30'}`}>
      {msg.video_id && <VideoPlayer playbackId={msg.video_id} />}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="text-sm font-abel font-medium text-dark-green">
          {msg.is_mine ? 'Sent by you' : msg.sender_name ?? 'Them'}
        </span>
        <span className="text-xs font-abel text-muted-foreground">{formatTimestamp(msg.created_at)}</span>
      </div>
    </div>
  )
}

function TextMessageCard({ msg }: { msg: ThreadMessage }) {
  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 ${
        msg.is_mine
          ? 'border-[#90EBD2] bg-[#90EBD2] text-dark-green'
          : 'border-dark-green bg-cotton text-dark-green'
      }`}
    >
      <p className="text-sm font-abel text-dark-green">{msg.body}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-abel text-muted-foreground">
          {msg.is_mine ? 'You' : msg.sender_name ?? 'Them'}
        </span>
        <span className="text-xs font-abel text-muted-foreground">{formatTimestamp(msg.created_at)}</span>
      </div>
    </div>
  )
}

function ContactShareCard({ msg, otherName }: { msg: ThreadMessage; otherName: string | null }) {
  if (!msg.body) return null

  let contact: { phone?: string; email?: string; website?: string } = {}
  try { contact = JSON.parse(msg.body) } catch { return null }

  const firstName = otherName?.trim().split(/\s+/)[0] ?? 'Your doula'

  if (msg.is_mine) {
    return (
      <div className="rounded-xl border-2 border-dark-green/20 bg-muted/40 px-4 py-3">
        <p className="text-xs font-abel text-muted-foreground">You shared your contact details</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-dark-green bg-cotton p-5">
      <p className="mb-1 font-arinoe text-xl text-dark-green">
        {firstName} shared her contact info with you 🎉
      </p>
      <p className="mb-4 text-sm font-abel text-dark-green/70">
        You&apos;ll contact her directly to move forward with your contract, payment, intake, etc.
      </p>
      <dl className="space-y-2">
        {contact.phone && (
          <div className="flex items-center gap-3">
            <dt className="w-16 shrink-0 text-xs font-abel text-muted-foreground">Phone</dt>
            <dd>
              <a href={`tel:${contact.phone}`} className="text-sm font-abel text-dark-green underline underline-offset-4 hover:opacity-70">
                {contact.phone}
              </a>
            </dd>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-3">
            <dt className="w-16 shrink-0 text-xs font-abel text-muted-foreground">Email</dt>
            <dd>
              <a href={`mailto:${contact.email}`} className="text-sm font-abel text-dark-green underline underline-offset-4 hover:opacity-70">
                {contact.email}
              </a>
            </dd>
          </div>
        )}
        {contact.website && (
          <div className="flex items-center gap-3">
            <dt className="w-16 shrink-0 text-xs font-abel text-muted-foreground">Website</dt>
            <dd>
              <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-sm font-abel text-dark-green underline underline-offset-4 hover:opacity-70">
                {contact.website.replace(/^https?:\/\//, '')}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}


// ── Turn banner ───────────────────────────────────────────────────────────────

function TurnBanner({ isMyTurn, otherName, role }: {
  isMyTurn: boolean
  otherName: string | null
  role: 'doula' | 'family'
}) {
  const waitingFor = otherName ?? (role === 'doula' ? 'family' : 'your doula')

  if (isMyTurn) {
    return (
      <div className="flex flex-col items-start gap-1.5 px-1 py-2">
        {/* Flag ribbon with "YOUR TURN" overlaid */}
        <div className="relative inline-flex h-11 w-48 items-center justify-center">
          <svg viewBox="0 0 192 44" className="absolute inset-0 h-full w-full" aria-hidden>
            <path fill="#FE7040" d="M0 0h175l17 22-17 22H0z" />
          </svg>
          <span className="relative font-arinoe text-sm tracking-wide text-cotton">
            Your turn
          </span>
        </div>
        <p className="text-xs font-abel text-dark-green/70 pl-1">
          Send a message when you&apos;re ready.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <span className="rounded-full bg-olive px-3 py-1.5 text-sm font-abel font-medium text-cotton">
        Waiting on {waitingFor}
      </span>
      <p className="text-xs font-abel text-dark-green/60">You&apos;ll see their reply here.</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConversationThread({
  initialData,
  currentUserId,
  connectionId,
}: {
  initialData: ThreadData
  currentUserId: string
  connectionId: string
}) {
  const { role, other_name, other_location, current_user_name, doula_contact, family_context } = initialData

  // ── State ─────────────────────────────────────────────────────────────────

  const [messages, setMessages]               = useState<ThreadMessage[]>(initialData.messages)
  const [textInput, setTextInput]             = useState('')
  const [sendingText, setSendingText]         = useState(false)
  const [textError, setTextError]             = useState(false)
  const [showUploader, setShowUploader]       = useState(false)
  const [pendingVideoId, setPendingVideoId]   = useState<string | null>(null)
  const [sendingVideo, setSendingVideo]       = useState(false)
  const [videoSendError, setVideoSendError]   = useState(false)
  // True if a contact_share message sent by the doula already exists
  const [contactShared, setContactShared] = useState(
    () => initialData.messages.some((m) => m.message_type === 'contact_share' && m.is_mine)
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Turn logic ────────────────────────────────────────────────────────────

  const lastMsg         = messages.length > 0 ? messages[messages.length - 1] : null
  const isMyTurn        = lastMsg ? lastMsg.sender_id !== currentUserId : role === 'doula'
  // Contact share card only appears once both sides have exchanged at least one message
  const bothHaveMessaged = messages.some((m) => m.is_mine) && messages.some((m) => !m.is_mine)

  // ── Scroll ────────────────────────────────────────────────────────────────

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Realtime subscription ─────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${connectionId}` },
        (payload) => {
          const raw = payload.new as {
            id: string; sender_id: string; message_type: string;
            video_id: string | null; video_url: string | null;
            body: string | null; created_at: string;
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev
            return [
              ...prev,
              {
                id:           raw.id,
                sender_id:    raw.sender_id,
                sender_name:  raw.sender_id === currentUserId ? current_user_name : other_name,
                message_type: raw.message_type as ThreadMessage['message_type'],
                video_id:     raw.video_id,
                video_url:    raw.video_url,
                body:         raw.body,
                created_at:   raw.created_at,
                is_mine:      raw.sender_id === currentUserId,
              },
            ]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [connectionId, currentUserId, current_user_name, other_name])

  // ── Send text ─────────────────────────────────────────────────────────────

  async function sendText() {
    const body = textInput.trim()
    if (!body || body.length > 300 || sendingText) return
    setSendingText(true)
    setTextError(false)
    setTextInput('') // clear immediately for snappiness

    const supabase = createClient()
    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id:     currentUserId,
        message_type:  'text',
        body,
      })
      .select('id, created_at')
      .single()

    if (error) {
      setTextInput(body) // restore on failure
      setTextError(true)
      setSendingText(false)
      return
    }

    // Add to state immediately — realtime will skip it (deduped by real DB id)
    setMessages((prev) => [
      ...prev,
      {
        id:           inserted.id,
        sender_id:    currentUserId,
        sender_name:  current_user_name,
        message_type: 'text',
        video_id:     null,
        video_url:    null,
        body,
        created_at:   inserted.created_at,
        is_mine:      true,
      },
    ])
    setSendingText(false)
  }

  // ── Send video ────────────────────────────────────────────────────────────

  async function sendVideo() {
    if (!pendingVideoId || sendingVideo) return
    setSendingVideo(true)
    setVideoSendError(false)

    const supabase = createClient()
    const { error } = await supabase.from('messages').insert({
      connection_id: connectionId,
      sender_id:     currentUserId,
      message_type:  'video',
      video_id:      pendingVideoId,
      video_url:     `https://stream.mux.com/${pendingVideoId}.m3u8`,
    })

    if (error) { setVideoSendError(true); setSendingVideo(false); return }
    setPendingVideoId(null)
    setShowUploader(false)
    setSendingVideo(false)
  }

  // ── Send contact ──────────────────────────────────────────────────────────

  async function sendContact() {
    if (!doula_contact || contactShared) return

    // Fire confetti immediately
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#FE7040', '#F55CB1', '#FFE404', '#90EBD2', '#F9F4E0'],
    })

    const payload: Record<string, string> = {}
    if (doula_contact.phone)   payload.phone   = doula_contact.phone
    if (doula_contact.email)   payload.email   = doula_contact.email
    if (doula_contact.website) payload.website = doula_contact.website

    const supabase = createClient()
    await supabase.from('messages').insert({
      connection_id: connectionId,
      sender_id:     currentUserId,
      message_type:  'contact_share',
      body:          JSON.stringify(payload),
    })

    setContactShared(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div>

        {/* ── Thread header ──────────────────────────────────────────────── */}
        <div className="border-b-2 border-dark-green/20 bg-cotton px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-center gap-3">

            {/* Back */}
            <Link
              href="/dashboard"
              className="mr-1 shrink-0 rounded-lg p-1.5 text-dark-green/60 hover:bg-muted hover:text-dark-green transition-colors"
              aria-label="Back to dashboard"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Avatar — popping-pink hexagon */}
            <span className="relative inline-flex h-10 w-9 shrink-0 items-center justify-center">
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
              <span className="relative text-[17px] font-arinoe leading-none tracking-tight text-cotton">
                {initials(other_name)}
              </span>
            </span>

            {/* Name + location */}
            <div className="min-w-0">
              <p className="truncate font-arinoe text-lg text-dark-green">
                {other_name ?? (role === 'doula' ? 'A family' : 'Your doula')}
              </p>
              {other_location && (
                <p className="truncate text-xs font-abel text-muted-foreground">{other_location}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────────────────────────── */}
        <div className="bg-cotton">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">

            {/* Pinned context card — doula only */}
            {role === 'doula' && family_context && (
              <>
                <FamilyContextCard
                  videoId={family_context.family_video_id}
                  reactionNote={family_context.reaction_note}
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t-2 border-dark-green/15" />
                  <span className="text-[10px] font-abel uppercase tracking-widest text-muted-foreground">
                    Conversation
                  </span>
                  <div className="flex-1 border-t-2 border-dark-green/15" />
                </div>
              </>
            )}

            {messages.length === 0 ? (
              <div className="py-10 text-center">
                {role === 'doula' ? (
                  <>
                    <p className="font-arinoe text-2xl text-dark-green">Start the conversation</p>
                    <p className="mt-2 text-sm font-abel text-muted-foreground max-w-sm mx-auto">
                      This family reached out because something in your profile resonated.
                      Send a short hello whenever you&apos;re ready.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-arinoe text-2xl text-dark-green">Waiting for the doula</p>
                    <p className="mt-2 text-sm font-abel text-muted-foreground max-w-sm mx-auto">
                      Your request has been shared. They&apos;ll send a hello here when they&apos;re ready.
                    </p>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.message_type === 'video')         return <VideoMessageCard key={msg.id} msg={msg} />
                if (msg.message_type === 'text')          return <TextMessageCard  key={msg.id} msg={msg} />
                if (msg.message_type === 'contact_share') return <ContactShareCard key={msg.id} msg={msg} otherName={other_name} />
                return null
              })
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input area ─────────────────────────────────────────────────── */}
        <div className="border-t-2 border-dark-green/20 bg-cotton">
          <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">

            {/* Turn banner */}
            <TurnBanner isMyTurn={isMyTurn} otherName={other_name} role={role} />

            {/* Message inputs — only when it's my turn */}
            {isMyTurn && (
              <div className="space-y-3">

                {/* ── Video section ─────────────────────────────────────── */}
                {!showUploader && !pendingVideoId && (
                  <button
                    type="button"
                    onClick={() => setShowUploader(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-green bg-cotton px-4 py-3 text-sm font-abel font-medium text-dark-green/70 hover:text-dark-green transition-colors"
                  >
                    <VideoCamera size={18} weight="duotone" className="shrink-0 text-dark-green" aria-hidden />
                    Record or upload a video message
                  </button>
                )}

                {showUploader && !pendingVideoId && (
                  <div className="space-y-2">
                    <VideoUploader
                      skipProfilePersist
                      onVideoReady={(playbackId) => setPendingVideoId(playbackId)}
                      onReset={() => { setPendingVideoId(null); setShowUploader(false) }}
                      heading="Send a video message"
                      description="Keep it natural — a quick update, a hello, or an answer to their question. Up to 2 minutes."
                    />
                    <button
                      type="button"
                      onClick={() => setShowUploader(false)}
                      className="text-xs font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {pendingVideoId && (
                  <div className="space-y-3">
                    <VideoPlayer playbackId={pendingVideoId} />
                    {videoSendError && (
                      <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-abel font-medium text-destructive">Video didn&apos;t send</p>
                        <p className="mt-0.5 text-xs font-abel text-muted-foreground">Please try again.</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={sendingVideo}
                        onClick={sendVideo}
                        className="rounded-lg bg-dark-green px-4 py-2 text-sm font-abel font-medium text-cotton hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        {sendingVideo ? 'Sending…' : 'Send video'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPendingVideoId(null); setShowUploader(false) }}
                        className="text-sm font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Divider */}
                {!pendingVideoId && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t-2 border-dark-green/15" />
                    <span className="text-xs font-abel text-muted-foreground">or</span>
                    <div className="flex-1 border-t-2 border-dark-green/15" />
                  </div>
                )}

                {/* ── Text section ──────────────────────────────────────── */}
                {!pendingVideoId && (
                  <div className="space-y-2">
                    <textarea
                      value={textInput}
                      onChange={(e) => {
                        if (e.target.value.length <= 300) setTextInput(e.target.value)
                        setTextError(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendText()
                      }}
                      placeholder="Write a message…"
                      rows={3}
                      className="w-full resize-none rounded-xl border-2 border-dark-green/30 bg-cotton px-3 py-2.5 text-sm font-abel text-dark-green placeholder:text-dark-green/40 focus:outline-none focus:border-dark-green"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-xs font-abel ${textInput.length > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {textInput.length}/300
                      </span>
                      <button
                        type="button"
                        disabled={!textInput.trim() || sendingText}
                        onClick={sendText}
                        className="rounded-full bg-dark-green px-4 py-2 text-sm font-abel font-medium text-cotton transition-colors hover:bg-popping-pink disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {sendingText ? 'Sending…' : 'Send message'}
                      </button>
                    </div>
                    {textError && (
                      <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-abel font-medium text-destructive">Message didn&apos;t send</p>
                        <p className="mt-0.5 text-xs font-abel text-muted-foreground">Please try again.</p>
                        <button
                          type="button"
                          onClick={sendText}
                          className="mt-2 text-xs font-abel font-medium text-dark-green underline underline-offset-4"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Share contact details — doula only, after both sides have messaged */}
            {role === 'doula' && (contactShared || bothHaveMessaged) && (
              <div className="border-t-2 border-dark-green/15 pt-4">
                {contactShared ? (
                  <div className="rounded-xl border-2 border-popping-pink bg-cotton p-5">
                    <p className="font-arinoe text-xl text-dark-green">Contact info shared! 🎉</p>
                    <p className="mt-1 text-sm font-abel text-dark-green/70">
                      You&apos;ve shared your contact details with{' '}
                      {other_name ?? 'this family'}. They&apos;ll be in touch soon — another client booked!
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-dark-green p-5">
                    <p className="font-arinoe text-xl text-cotton">Ready to work with this family?</p>
                    <p className="mt-1 mb-4 text-sm font-abel text-cotton/70">
                      Click this button to share your contact info so this family can take the next step and get booked via your typical process.
                    </p>
                    <button
                      type="button"
                      onClick={sendContact}
                      className="rounded-full bg-cotton px-5 py-2.5 text-sm font-abel font-medium text-dark-green transition-colors hover:bg-popping-pink hover:text-cotton"
                    >
                      Share my info
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  )
}
