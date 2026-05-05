import { createClient } from '@/lib/supabase/server'
import { NavBarClient } from './nav-bar-client'

/**
 * Server component — fetches the current user's role and (for doulas)
 * their pending connection count on every request.
 * Always renders (logged-out users see the public nav).
 */
export async function NavBar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <NavBarClient role={null} pendingCount={0} />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (profile?.role as 'doula' | 'family') ?? null

  // For doulas, count pending connection requests for the nav badge
  let pendingCount = 0
  if (role === 'doula') {
    try {
      const { data: dp } = await supabase
        .from('doula_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (dp) {
        const { count } = await supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('doula_id', dp.id)
          .eq('status', 'pending')
        pendingCount = count ?? 0
      }
    } catch {
      pendingCount = 0
    }
  }

  return <NavBarClient role={role} pendingCount={pendingCount} />
}
