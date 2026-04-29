/**
 * /profile/edit
 *
 * Unified edit page for family profiles.
 * Re-uses the family onboarding form — same fields, same save logic,
 * same pre-population. After saving, the user lands on /doulas.
 */
import { redirect } from 'next/navigation'

export default function ProfileEditPage() {
  // The family onboarding page already handles pre-population and
  // works as both an onboarding and an edit flow.
  redirect('/onboarding/family')
}
