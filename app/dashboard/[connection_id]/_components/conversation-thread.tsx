'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { VideoUploader } from '@/components/video/VideoUploader'
import type { ThreadData, ThreadMessage } from '../_types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function initial(name: string | null | undefined): string {
  return name?.trim().charAt(0).toUpperCase() ?? '?'
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const diffMs   = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const time = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })

  if (diffDays === 0)  return time
  if (diffDays < 7)   return `${date.toLocaleDateString('en-GB', { weekday: 'short' })} ${time}`
  return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${time}`
}

// ── Family context card (doula-only, pinned above messages) ──────────────────

function FamilyContextCard({
  videoId,
  reactionNote,
}: {
  videoId:      string | null
  reactionNote: string | null
}) {
  // Don't render if there's nothing to show
  if (!videoId && !reactionNote) return null

  return (
    <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
      {videoId && <VideoPlayer playbackId={videoId} />}
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Why they reached out
        </p>
        {reactionNote ? (
          <p className="text-sm text-foreground/80">{reactionNote}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No message left.</p>
        )}
      </div>
    </div>
  )
}

// ── Message cards ─────────────────────────────────────────────────────────────

function VideoMessageCard({ msg }: { msg: ThreadMessage }) {
  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${msg.is_mine ? 'border-foreground/20' : 'border-border'}`}>
      {msg.video_id && (
        <VideoPlayer playbackId={msg.video_id} />
      )}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="text-sm font-medium text-foreground">
          {msg.is_mine ? 'Sent by you' : msg.sender_name ?? 'Them'}
        </span>
        <span className="text-xs text-muted-foreground">{formatTimestamp(msg.created_at)}</span>
      </div>
    </div>
  )
}

function TextMessageCard({ msg }: { msg: ThreadMessage }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${msg.is_mine ? 'bg-foreground/5 border-foreground/15' : 'bg-card border-border'}`}>
      <p className="text-sm text-foreground">{msg.body}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {msg.is_mine ? 'You' : msg.sender_name ?? 'Them'}
        </span>
        <span className="text-xs text-muted-foreground">{formatTimestamp(msg.created_at)}</span>
      </div>
    </div>
  )
}

function ContactShareCard({ msg, otherName }: { msg: ThreadMessage; otherName: string | null }) {
  if (!msg.body) return null

  let contact: { phone?: string; email?: string; website?: string } = {}
  try {
    contact = JSON.parse(msg.body)
  } catch {
    return null
  }

  if (msg.is_mine) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-xs text-muted-foreground">You shared your contact details</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">
        Contact details from {otherName ?? 'your doula'}
      </p>
      <dl className="space-y-2">
        {contact.phone && (
          <div className="flex items-center gap-3">
            <dt className="w-16 shrink-0 text-xs text-muted-foreground">Phone</dt>
            <dd>
              <a
                href={`tel:${contact.phone}`}
                className="text-sm text-foreground underline underline-offset-4 hover:opacity-70"
              >
                {contact.phone}
              </a>
            </dd>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-3">
            <dt className="w-16 shrink-0 text-xs text-muted-foreground">Email</dt>
            <dd>
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-foreground underline underline-offset-4 hover:opacity-70"
              >
                {contact.email}
              </a>
            </dd>
          </div>
        )}
        {contact.website && (
          <div className="flex items-center gap-3">
            <dt className="w-16 shrink-0 text-xs text-muted-foreground">Website</dt>
            <dd>
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground underline underline-offset-4 hover:opacity-70"
              >
                {contact.website.replace(/^https?:\/\//, '')}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

// ── Contact share modal ───────────────────────────────────────────────────────

function ContactShareModal({
  otherName,
  onConfirm,
  onCancel,
  sending,
}: {
  otherName: string | null
  onConfirm: () => void
  onCancel: () => void
  sending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
        <h2 className="mb-2 text-base font-semibold text-foreground">Share your details?</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          This will share your phone number, email, and website with{' '}
          <span className="font-medium text-foreground">{otherName ?? 'this family'}</span>.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={sending}
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Yes, share'}
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
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

  const [messages, setMessages]           = useState<ThreadMessage[]>(initialData.messages)
  const [textInput, setTextInput]         = useState('')
  const [sendingText, setSendingText]     = useState(false)
  const [textError, setTextError]         = useState(false)
  const [showUploader, setShowUploader]   = useState(false)
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null)
  const [sendingVideo, setSendingVideo]   = useState(false)
  const [videoSendError, setVideoSendError] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [sendingContact, setSendingContact] = useState(false)

  const messagesEndRef      = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // ── Turn logic ────────────────────────────────────────────────────────────

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
  // No messages → doula goes first. Otherwise: whoever sent last → other party's turn.
  const isMyTurn = lastMsg
    ? lastMsg.sender_id !== currentUserId
    : role === 'doula'

  // ── Scroll to bottom ──────────────────────────────────────────────────────

  useEffect(() => {
    // Initial scroll to bottom
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
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
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const raw = payload.new as {
            id: string; sender_id: string; message_type: string;
            video_id: string | null; video_url: string | null;
            body: string | null; created_at: string;
          }
          // Avoid duplicates from our own optimistic sends
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

    const supabase = createClient()
    const { error } = await supabase.from('messages').insert({
      connection_id: connectionId,
      sender_id:     currentUserId,
      message_type:  'text',
      body,
    })

    if (error) {
      setTextError(true)
      setSendingText(false)
      return
    }

    setTextInput('')
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

    if (error) {
      setVideoSendError(true)
      setSendingVideo(false)
      return
    }

    setPendingVideoId(null)
    setShowUploader(false)
    setSendingVideo(false)
  }

  // ── Send contact details ──────────────────────────────────────────────────

  async function sendContact() {
    if (!doula_contact || sendingContact) return
    setSendingContact(true)

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

    setShowContactModal(false)
    setSendingContact(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {showContactModal && (
        <ContactShareModal
          otherName={other_name}
          onConfirm={sendContact}
          onCancel={() => setShowContactModal(false)}
          sending={sendingContact}
        />
      )}

      {/*
        Full-viewport layout: header → scrollable messages → sticky input.
        pt-14 accounts for the sticky NavBar (h-14).
      */}
      <div
        className="flex flex-col"
        style={{ height: 'calc(100dvh - 3.5rem)' }}
      >

        {/* ── Thread header ────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border bg-background px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-center gap-3">

            {/* Back */}
            <Link
              href="/dashboard"
              className="mr-1 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Back to dashboard"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
              {initial(other_name)}
            </div>

            {/* Name + location */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {other_name ?? (role === 'doula' ? 'A family' : 'Your doula')}
              </p>
              {other_location && (
                <p className="truncate text-xs text-muted-foreground">{other_location}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Messages ─────────────────────────────────────────────────── */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">

            {/* Pinned context card — doula only */}
            {role === 'doula' && family_context && (
              <>
                <FamilyContextCard
                  videoId={family_context.family_video_id}
                  reactionNote={family_context.reaction_note}
                />
                {/* Visual separator between context and conversation */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Conversation
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>
              </>
            )}

            {messages.length === 0 ? (
              /* Empty thread state */
              <div className="py-10 text-center">
                {role === 'doula' ? (
                  <>
                    <p className="text-base font-semibold text-foreground">Start the conversation</p>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                      This family reached out because something in your profile resonated.
                      Send a short hello whenever you&apos;re ready.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-foreground">Waiting for the doula</p>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                      Your request has been shared. They&apos;ll send a hello here when they&apos;re ready.
                    </p>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.message_type === 'video') {
                  return <VideoMessageCard key={msg.id} msg={msg} />
                }
                if (msg.message_type === 'text') {
                  return <TextMessageCard key={msg.id} msg={msg} />
                }
                if (msg.message_type === 'contact_share') {
                  return <ContactShareCard key={msg.id} msg={msg} otherName={other_name} />
                }
                return null
              })
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input area ───────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border bg-background">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">

            {/* Turn indicator */}
            <div className={`rounded-xl px-4 py-3 ${isMyTurn ? 'bg-primary/8' : 'bg-muted/50'}`}>
              <p className={`text-sm font-semibold ${isMyTurn ? 'text-primary' : 'text-foreground'}`}>
                {isMyTurn ? 'Your turn' : `Waiting on ${other_name ?? (role === 'doula' ? 'family' : 'your doula')}`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isMyTurn
                  ? 'Send a message when you\'re ready.'
                  : 'You\'ll see their reply here.'}
              </p>
            </div>

            {/* Message input — only when it's my turn */}
            {isMyTurn && (
              <div className="space-y-3">

                {/* ── Video section ───────────────────────────────────── */}
                {!showUploader && !pendingVideoId && (
                  <button
                    type="button"
                    onClick={() => setShowUploader(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    Add a video
                  </button>
                )}

                {showUploader && !pendingVideoId && (
                  <div className="space-y-2">
                    <VideoUploader
                      skipProfilePersist
                      onVideoReady={(playbackId) => setPendingVideoId(playbackId)}
                      onReset={() => {
                        setPendingVideoId(null)
                        setShowUploader(false)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUploader(false)}
                      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {pendingVideoId && (
                  <div className="space-y-3">
                    <VideoPlayer playbackId={pendingVideoId} />
                    {videoSendError && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-medium text-destructive">Video didn&apos;t send</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Please try again. Your message hasn&apos;t been delivered yet.
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={sendingVideo}
                        onClick={sendVideo}
                        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        {sendingVideo ? 'Sending…' : 'Send video'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPendingVideoId(null); setShowUploader(false) }}
                        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        {videoSendError ? 'Try again later' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Divider */}
                {!pendingVideoId && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                )}

                {/* ── Text section ────────────────────────────────────── */}
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
                      className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-xs ${textInput.length > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {textInput.length}/300
                      </span>
                      <button
                        type="button"
                        disabled={!textInput.trim() || sendingText}
                        onClick={sendText}
                        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        {sendingText ? 'Sending…' : 'Send message'}
                      </button>
                    </div>
                    {textError && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-medium text-destructive">Message didn&apos;t send</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Please try again. Your message hasn&apos;t been delivered yet.
                        </p>
                        <button
                          type="button"
                          onClick={sendText}
                          className="mt-2 text-xs font-medium text-foreground underline underline-offset-4"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Share contact details — doula only, always visible */}
            {role === 'doula' && (
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Share my details
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  )
}
