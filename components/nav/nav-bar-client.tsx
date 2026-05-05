'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  role:         'doula' | 'family' | null
  pendingCount: number
}

// ── Honeycomb badge ───────────────────────────────────────────────────────────
// Shown on the Dashboard nav link when the doula has pending connection requests.

function HexBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="relative inline-flex h-[20px] w-[18px] shrink-0 items-center justify-center">
      {/* Honeycomb shape */}
      <svg
        viewBox="0 0 980.68 1080"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <path
          fill="#FE7040"
          d="M884.66,265.76L523.27,57.11c-23.22-13.41-51.83-13.41-75.06,0L86.82,265.76
             c-23.22,13.41-37.53,38.19-37.53,65v417.3c0,26.82,14.31,51.59,37.53,65
             l361.4,208.65c23.22,13.41,51.83,13.41,75.06,0l361.39-208.65
             c23.22-13.41,37.53-38.19,37.53-65v-417.3
             c0-26.81-14.31-51.59-37.53-65Z"
        />
      </svg>
      {/* Count number */}
      <span className="relative text-[9px] font-abel font-bold leading-none text-cotton">
        {count > 9 ? '9+' : count}
      </span>
    </span>
  )
}

// ── Nav bar ───────────────────────────────────────────────────────────────────

export function NavBarClient({ role, pendingCount }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-dark-green">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">

        {/* Logo — always visible */}
        <Link href="/" className="shrink-0 hover:opacity-85 transition-opacity">
          <Image
            src="/logos/DH_Primary_creamltblue.png"
            alt="The Doula Hive"
            height={36}
            width={144}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 font-abel sm:gap-2">

          {role === null && (
            <>
              <Link
                href="/doulas"
                className="rounded-full px-3 py-1.5 text-sm text-cotton/80 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                Find a doula
              </Link>
              <Link
                href="/signup"
                className="rounded-full px-3 py-1.5 text-sm text-cotton/80 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                Join as a doula
              </Link>
            </>
          )}

          {role === 'family' && (
            <>
              <Link
                href="/doulas"
                className="rounded-full px-3 py-1.5 text-sm text-cotton/80 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-sm text-cotton/80 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                My conversations
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 rounded-full px-3 py-1.5 text-sm text-cotton/70 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                Log out
              </button>
            </>
          )}

          {role === 'doula' && (
            <>
              <Link
                href="/onboarding/doula"
                className="rounded-full px-3 py-1.5 text-sm text-cotton/80 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                My profile
              </Link>
              <Link
                href="/dashboard"
                className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-cotton/80 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                Dashboard
                <HexBadge count={pendingCount} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 rounded-full px-3 py-1.5 text-sm text-cotton/70 hover:bg-white/10 hover:text-cotton transition-colors"
              >
                Log out
              </button>
            </>
          )}

        </nav>
      </div>
    </header>
  )
}
