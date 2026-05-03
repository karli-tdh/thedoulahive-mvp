import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * After a successful sign-in or sign-up, look up the user's role and
 * onboarding state, then push them to the right destination.
 *
 * - No profiles row            → /signup  (manually-created Supabase users)
 * - role = 'doula'             → /onboarding/doula
 * - role = 'family', no completed onboarding
 *   (no family_profiles row, or due_date is null)
 *                              → /onboarding/family
 * - role = 'family', onboarding complete, no connections yet
 *                              → /doulas
 * - role = 'family', onboarding complete, has connections
 *                              → /dashboard
 */
export async function redirectByRole(
  supabase: SupabaseClient,
  router: AppRouterInstance
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    router.push('/login')
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    router.push('/signup')
    return
  }

  if (profile.role === 'doula') {
    const { data: doulaProfile } = await supabase
      .from('doula_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    router.push(doulaProfile ? '/dashboard' : '/onboarding/doula')
    router.refresh()
    return
  }

  // Family: check onboarding completion, then connection state.
  // due_date is the first required field — if it's null, onboarding isn't done.
  const { data: familyProfile } = await supabase
    .from('family_profiles')
    .select('id, due_date')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!familyProfile?.due_date) {
    // No profile row, or onboarding not yet completed
    router.push('/onboarding/family')
    router.refresh()
    return
  }

  // Onboarding done — go to dashboard if they have connections, otherwise browse
  const { count } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyProfile.id)

  router.push((count ?? 0) > 0 ? '/dashboard' : '/doulas')
  router.refresh()
}
