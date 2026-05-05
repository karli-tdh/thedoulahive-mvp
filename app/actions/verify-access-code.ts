'use server'

import { createClient } from '@/lib/supabase/server'

export async function verifyAccessCode(
  code: string,
  doulaProfileId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Check the code is active and not expired
  const { data: match } = await supabase
    .from('access_codes')
    .select('id')
    .eq('code', code.trim())
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!match) {
    return {
      success: false,
      error: "That code isn't right — grab the current code from The Hive on Circle.",
    }
  }

  // Mark this doula as circle_verified
  const { error: updateError } = await supabase
    .from('doula_profiles')
    .update({ circle_verified: true })
    .eq('id', doulaProfileId)

  if (updateError) {
    console.error('[verifyAccessCode] update error:', updateError.message)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
