'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Phase = 'idle' | 'form' | 'submitting' | 'done'

interface ConnectButtonProps {
  doulaProfileId:   string
  doulaName:        string
  returnPath:       string
  alreadyConnected?: boolean
}

export function ConnectButton({
  doulaProfileId,
  doulaName,
  returnPath,
  alreadyConnected = false,
}: ConnectButtonProps) {
  const [phase, setPhase] = useState<Phase>(() => alreadyConnected ? 'done' : 'idle')
  const [note, setNote]   = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // ── Step 1: open the form ─────────────────────────────────────────────────

  async function handleOpen() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/signup?returnTo=${encodeURIComponent(returnPath)}`)
      return
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    if (profile?.role !== 'family') {
      setError('Only families can send connection requests.')
      return
    }

    setPhase('form')
  }

  // ── Step 2: submit ────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!note.trim()) return
    setPhase('submitting')
    setError(null)

    try {
      const res  = await fetch('/api/connections', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ doulaProfileId, reactionNote: note.trim() }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        setPhase('form')
        return
      }

      setPhase('done')
    } catch (err) {
      console.error('[ConnectButton] Network error:', err)
      setError('Network error — please check your connection and try again.')
      setPhase('form')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <div className="my-8 rounded-xl border-2 border-dark-green bg-soft-yellow/40 p-6 text-center">
        <p className="font-arinoe text-xl text-dark-green">Your request has been sent.</p>
        <p className="mt-1.5 text-sm font-abel text-muted-foreground">
          {doulaName} will be in touch soon.
        </p>
      </div>
    )
  }

  if (phase === 'form' || phase === 'submitting') {
    return (
      <div className="my-8 rounded-xl border-2 border-dark-green bg-[#F9F4E0] p-6 space-y-4">
        <div>
          <label className="block text-sm font-abel font-medium text-dark-green">
            What caught your attention?
          </label>
          <p className="mt-0.5 text-xs font-abel text-muted-foreground">
            This will be the first thing {doulaName} reads.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell them what resonated with you…"
            rows={4}
            disabled={phase === 'submitting'}
            className="mt-2 w-full resize-none rounded-lg border-2 border-dark-green/40 bg-cotton px-3 py-2 text-sm font-abel text-dark-green placeholder:text-dark-green/40 focus:outline-none focus:border-dark-green disabled:opacity-60"
          />
        </div>

        {error && <p className="text-sm font-abel text-destructive">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!note.trim() || phase === 'submitting'}
            className="rounded-full bg-dark-green px-6 py-2.5 text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-[#F55CB1] disabled:opacity-40"
          >
            {phase === 'submitting' ? 'Sending…' : 'Send connection request'}
          </button>
          <button
            type="button"
            onClick={() => { setPhase('idle'); setError(null) }}
            disabled={phase === 'submitting'}
            className="rounded-full border-2 border-dark-green px-5 py-2.5 text-sm font-abel font-medium text-dark-green hover:bg-dark-green hover:text-cotton transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Idle — sticky pill only (no inline button)
  return (
    <>
      {/* Any role-check error shows inline */}
      {error && <p className="mb-3 text-sm font-abel text-destructive">{error}</p>}

      {/* Sticky pill — visible immediately, fixed to bottom of viewport */}
      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-40 flex justify-center">
        <button
          type="button"
          onClick={handleOpen}
          className="pointer-events-auto rounded-full bg-dark-green px-10 py-3.5 font-abel text-base font-medium text-cotton shadow-[0_4px_20px_rgba(7,64,59,0.30)] transition-colors duration-200 hover:bg-[#F55CB1]"
        >
          Connect with {doulaName}
        </button>
      </div>
    </>
  )
}
