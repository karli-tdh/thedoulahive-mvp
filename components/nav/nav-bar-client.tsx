'use client'

import Image from 'next/image'
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
    <header className="sticky top-0 z-40 bg-dark-green">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">

        {/* Logo */}
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

        {/* Nav links — Abel, cotton colour */}
        <nav className="flex items-center gap-1 sm:gap-2 font-abel">
          {role === 'family' ? (
            <>
              <Link
                href="/doulas"
                className="rounded-lg px-3 py-1.5 text-sm text-cotton/80 hover:text-cotton hover:bg-white/10 transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-cotton/80 hover:text-cotton hover:bg-white/10 transition-colors"
              >
                My connections
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/onboarding/doula"
                className="rounded-lg px-3 py-1.5 text-sm text-cotton/80 hover:text-cotton hover:bg-white/10 transition-colors"
              >
                My profile
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-cotton/80 hover:text-cotton hover:bg-white/10 transition-colors"
              >
                Dashboard
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 rounded-lg px-3 py-1.5 text-sm text-cotton/70 hover:text-cotton hover:bg-white/10 transition-colors"
          >
            Log out
          </button>
        </nav>

      </div>
    </header>
  )
}
