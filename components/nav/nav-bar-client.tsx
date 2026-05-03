'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  role: 'doula' | 'family'
}

export function NavBarClient({ role }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          The Doula Hive
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {role === 'family' ? (
            <>
              <Link
                href="/doulas"
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                My connections
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/onboarding/doula"
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                My profile
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </nav>

      </div>
    </header>
  )
}
