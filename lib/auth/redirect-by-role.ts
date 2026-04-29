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
 * - role = 'family', onboarding complete
 *   (family_profiles row exists with due_date set)
 *                              → /doulas
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

  // Family: check whether onboarding has been completed.
  // due_date is the first required field — if it's set, onboarding is done.
  const { data: familyProfile } = await supabase
    .from('family_profiles')
    .select('due_date')
    .eq('user_id', user.id)
    .maybeSingle()

  if (familyProfile?.due_date) {
    router.push('/doulas')
  } else {
    router.push('/onboarding/family')
  }

  router.refresh()
}
