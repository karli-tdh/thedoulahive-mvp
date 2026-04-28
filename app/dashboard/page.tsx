'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SavedBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('saved') !== 'true') return null
  return (
    <div className="rounded-lg bg-muted px-6 py-4 text-center text-sm text-foreground">
      Your profile is saved. Go live whenever you&apos;re ready.
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <Suspense>
        <SavedBanner />
      </Suspense>
      <h1 className="text-2xl font-semibold text-foreground">
        Dashboard coming soon
      </h1>
      <button onClick={handleLogout}>Log out</button>
    </main>
  )
}
