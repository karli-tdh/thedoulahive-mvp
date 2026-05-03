import { createClient } from '@/lib/supabase/server'
import { NavBarClient } from './nav-bar-client'

/**
 * Server component — fetches the current user's role on every request.
 * Renders nothing if the user is not logged in (login/signup pages stay clean).
 * Passes role to NavBarClient which handles links and the logout action.
 */
export async function NavBar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.role) return null

  return <NavBarClient role={profile.role as 'doula' | 'family'} />
}
