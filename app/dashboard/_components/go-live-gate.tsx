'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cotton/40 focus-visible:ring-offset-2
        ${checked ? 'bg-cotton/30' : 'bg-cotton/20'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-cotton shadow transition-transform ${
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
      <div className="rounded-xl bg-dark-green px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-start gap-3">
            <LockOpen size={22} weight="duotone" className="mt-0.5 shrink-0 text-cotton" aria-hidden />
            <div>
              <p className="font-arinoe text-lg text-cotton">GO LIVE</p>
              <p className="mt-0.5 text-sm font-abel text-cotton/70">
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
    <div className="rounded-xl bg-dark-green px-5 py-6 sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">

        {/* Left: icon + heading + copy */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Lock size={22} weight="duotone" className="mt-0.5 shrink-0 text-cotton" aria-hidden />
          <div className="space-y-1.5">
            <p className="font-arinoe text-lg text-cotton">GO LIVE</p>
            <p className="text-sm font-abel text-cotton/80 leading-relaxed">
              Your doula profile can go live as soon as you join our community in Circle! Find the
              monthly access code after you{' '}
              <Link
                href="https://thedoulahive.circle.so/checkout/birth-pros"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFE404] underline underline-offset-4 hover:text-popping-pink transition-colors"
              >
                join here
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Right: access code form */}
        <div className="w-full sm:w-[300px] shrink-0">
          {!inputOpen ? (
            <button
              type="button"
              onClick={() => setInputOpen(true)}
              className="rounded-full border-2 border-cotton px-5 py-2 text-sm font-abel font-bold text-cotton transition-colors hover:bg-cotton hover:text-dark-green"
            >
              Enter access code
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Access code"
                  autoFocus
                  className="flex-1 min-w-0 rounded-full border-2 border-cotton/40 bg-white/10 px-4 py-2 text-sm font-abel text-cotton placeholder:text-cotton/50 focus:border-cotton focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={isPending || !code.trim()}
                  className="shrink-0 rounded-full bg-cotton px-4 py-2 text-sm font-abel font-bold text-dark-green transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {isPending ? 'Checking…' : 'Unlock'}
                </button>
              </div>
              {codeError && (
                <p className="text-sm font-abel text-popping-pink">{codeError}</p>
              )}
              <button
                type="button"
                onClick={() => { setInputOpen(false); setCode(''); setCodeError(null) }}
                className="text-xs font-abel text-cotton/60 underline underline-offset-4 hover:text-cotton"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
