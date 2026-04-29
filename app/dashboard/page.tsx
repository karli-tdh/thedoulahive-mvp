'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Saved banner (doula onboarding) ──────────────────────────────────────────

function SavedBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('saved') !== 'true') return null
  return (
    <div className="rounded-xl bg-muted px-6 py-4 text-center text-sm text-foreground">
      Your profile is saved. Go live whenever you&apos;re ready.
    </div>
  )
}

// ── Family: intro video nudge ─────────────────────────────────────────────────

function FamilyNudge() {
  const [show, setShow] = useState<boolean | null>(null)  // null = loading

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setShow(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'family') { setShow(false); return }

      const { data: fp } = await supabase
        .from('family_profiles')
        .select('intro_video_url')
        .eq('user_id', user.id)
        .maybeSingle()

      // Show nudge if no profile yet, or profile has no video
      setShow(!fp?.intro_video_url)
    }
    check()
  }, [])

  if (!show) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        {/* Camera icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-foreground">Add an intro video</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Doulas reply faster when they can see you. It only takes a minute.
          </p>
          <Link
            href="/profile/edit"
            className="mt-3 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity"
          >
            Add intro video
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6">
      <div className="space-y-6">

        <Suspense>
          <SavedBanner />
        </Suspense>

        <FamilyNudge />

        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Log out
        </button>

      </div>
    </main>
  )
}
