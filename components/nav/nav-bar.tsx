import { createClient } from '@/lib/supabase/server'
import { NavBarClient } from './nav-bar-client'

/**
 * Server component — fetches the current user's role on every request.
 * Always renders (logged-out users see the public nav).
 * Passes role (or null) to NavBarClient.
 */
export async function NavBar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <NavBarClient role={null} />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return <NavBarClient role={(profile?.role as 'doula' | 'family') ?? null} />
}
