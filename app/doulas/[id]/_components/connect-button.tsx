'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Phase = 'idle' | 'form' | 'submitting' | 'done' | 'error'

interface ConnectButtonProps {
  doulaProfileId: string   // doula_profiles.id — used as connections.doula_id
  doulaName: string
  returnPath: string       // e.g. /doulas/[id] — for post-signup redirect
}

export function ConnectButton({ doulaProfileId, doulaName, returnPath }: ConnectButtonProps) {
  const [phase, setPhase]   = useState<Phase>('idle')
  const [note, setNote]     = useState('')
  const [error, setError]   = useState<string | null>(null)
  const router = useRouter()

  // ── Step 1: button click ──────────────────────────────────────────────────

  async function handleOpen() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to signup; after auth they'll land back here
      router.push(`/signup?returnTo=${encodeURIComponent(returnPath)}`)
      return
    }

    // Doulas can't connect with other doulas
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

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

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signup'); return }

    // Get or create the family_profiles row (family onboarding may not be done yet)
    let { data: familyProfile } = await supabase
      .from('family_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!familyProfile) {
      const { data: created, error: createErr } = await supabase
        .from('family_profiles')
        .insert({ user_id: user.id })
        .select('id')
        .single()

      if (createErr || !created) {
        setError('Something went wrong. Please try again.')
        setPhase('form')
        return
      }
      familyProfile = created
    }

    // Insert connection
    const { error: insertErr } = await supabase
      .from('connections')
      .insert({
        family_id:     familyProfile.id,
        doula_id:      doulaProfileId,
        reaction_note: note.trim(),
        status:        'pending',
      })

    if (insertErr) {
      // Unique constraint = already sent — treat as success
      if (insertErr.code === '23505') {
        setPhase('done')
        return
      }
      setError('Couldn\'t send your request. Please try again.')
      setPhase('form')
      return
    }

    setPhase('done')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center">
        <p className="font-semibold text-foreground">Your request has been sent.</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {doulaName} will be in touch soon.
        </p>
      </div>
    )
  }

  if (phase === 'form' || phase === 'submitting') {
    return (
      <div className="rounded-2xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">
            What caught your attention?
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This will be the first thing {doulaName} reads.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell them what resonated with you…"
            rows={4}
            disabled={phase === 'submitting'}
            className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!note.trim() || phase === 'submitting'}
            className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {phase === 'submitting' ? 'Sending…' : 'Send connection request'}
          </button>
          <button
            type="button"
            onClick={() => { setPhase('idle'); setError(null) }}
            disabled={phase === 'submitting'}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Idle (default)
  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-destructive">{error}</p>
      )}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full rounded-xl bg-foreground px-6 py-3 text-base font-medium text-background hover:opacity-80 transition-opacity sm:w-auto"
      >
        Connect with {doulaName}
      </button>
    </div>
  )
}
