import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * After a successful sign-in or sign-up, look up the user's role in the
 * profiles table and push them to the right onboarding route.
 *
 * - No profile row → /signup (handles manually-created Supabase users)
 * - role = 'doula'  → /onboarding/doula
 * - role = 'family' → /onboarding/family
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
    // No profiles row — send them back to signup to pick a role
    router.push('/signup')
    return
  }

  if (profile.role === 'doula') {
    router.push('/onboarding/doula')
  } else {
    // Family onboarding not yet built — send families straight to browse
    router.push('/doulas')
  }

  router.refresh()
}
