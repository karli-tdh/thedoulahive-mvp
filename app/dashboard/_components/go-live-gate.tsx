'use client'

import { useState, useTransition } from 'react'
import { Lock, LockOpen } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { verifyAccessCode } from '@/app/actions/verify-access-code'

interface GoLiveGateProps {
  doulaProfileId: string
  circleVerified: boolean
  isPublished:    boolean
}

// ── Toggle pill ───────────────────────────────────────────────────────────────

function TogglePill({
  checked,
  onToggle,
}: {
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        ${checked ? 'bg-dark-green' : 'bg-muted-foreground/30'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function GoLiveGate({
  doulaProfileId,
  circleVerified: initialVerified,
  isPublished:    initialPublished,
}: GoLiveGateProps) {
  const [verified,  setVerified]  = useState(initialVerified)
  const [published, setPublished] = useState(initialPublished)
  const [inputOpen, setInputOpen] = useState(false)
  const [code,      setCode]      = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Toggle is_published (only when verified) ──────────────────────────────

  async function handleToggle() {
    const next = !published
    setPublished(next)
    const supabase = createClient()
    const { error } = await supabase
      .from('doula_profiles')
      .update({ is_published: next })
      .eq('id', doulaProfileId)
    if (error) setPublished(!next) // roll back on error
  }

  // ── Validate access code ──────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(null)
    startTransition(async () => {
      const result = await verifyAccessCode(code, doulaProfileId)
      if (result.success) {
        setVerified(true)
        setInputOpen(false)
        setCode('')
      } else {
        setCodeError(result.error ?? 'Invalid code.')
      }
    })
  }

  // ── Unlocked view ─────────────────────────────────────────────────────────

  if (verified) {
    return (
      <div className="rounded-xl border-2 border-dark-green/20 bg-card px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <LockOpen size={22} weight="duotone" className="mt-0.5 shrink-0 text-dark-green" aria-hidden />
            <div>
              <p className="font-arinoe text-lg text-dark-green">Go Live</p>
              <p className="mt-0.5 text-sm font-abel text-muted-foreground">
                {published
                  ? 'Your profile is visible to families.'
                  : 'Your profile is hidden from search.'}
              </p>
            </div>
          </div>
          <TogglePill checked={published} onToggle={handleToggle} />
        </div>
      </div>
    )
  }

  // ── Locked view ───────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border-2 border-dark-green/20 bg-card px-5 py-5 space-y-4">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Lock size={22} weight="duotone" className="mt-0.5 shrink-0 text-dark-green" aria-hidden />
        <div className="space-y-1">
          <p className="font-arinoe text-lg text-dark-green">Go Live</p>
          <p className="text-sm font-abel text-muted-foreground">
            Join The Hive to unlock your profile. Find your access code in the Circle community.
          </p>
          {!inputOpen && (
            <button
              type="button"
              onClick={() => setInputOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-dark-green px-4 py-1.5 text-sm font-abel font-bold text-dark-green transition-colors hover:bg-dark-green hover:text-cotton"
            >
              Enter access code
            </button>
          )}
        </div>
      </div>

      {/* Inline code entry */}
      {inputOpen && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              autoFocus
              className="flex-1 rounded-lg border-2 border-dark-green/30 bg-background px-3 py-2 text-sm font-abel text-dark-green placeholder:text-muted-foreground focus:border-dark-green focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isPending || !code.trim()}
              className="rounded-lg bg-dark-green px-4 py-2 text-sm font-abel font-medium text-cotton transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {isPending ? 'Checking...' : 'Unlock'}
            </button>
          </div>
          {codeError && (
            <p className="text-sm font-abel text-destructive">{codeError}</p>
          )}
          <button
            type="button"
            onClick={() => { setInputOpen(false); setCode(''); setCodeError(null) }}
            className="text-xs font-abel text-muted-foreground underline underline-offset-4 hover:text-dark-green"
          >
            Cancel
          </button>
        </form>
      )}

    </div>
  )
}
