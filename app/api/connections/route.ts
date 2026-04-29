import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/connections
 * Creates a connection request from a family user to a doula.
 *
 * Body: { doulaProfileId: string, reactionNote: string }
 *
 * Steps:
 *  1. Verify the caller is authenticated and has role = 'family'
 *  2. Get or create their family_profiles row (onboarding may not be done yet)
 *  3. Insert into connections — duplicate is treated as success
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // ── 1. Auth ───────────────────────────────────────────────────────────────

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // ── 2. Role check ─────────────────────────────────────────────────────────

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'family') {
    return NextResponse.json(
      { error: 'Only family accounts can send connection requests.' },
      { status: 403 }
    )
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────

  let doulaProfileId: string
  let reactionNote: string
  try {
    const body = await request.json()
    doulaProfileId = body.doulaProfileId
    reactionNote   = body.reactionNote
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!doulaProfileId || !reactionNote?.trim()) {
    return NextResponse.json(
      { error: 'doulaProfileId and reactionNote are required' },
      { status: 400 }
    )
  }

  // ── 4. Get or create family_profiles row ──────────────────────────────────

  const { data: existingProfile, error: fpSelectErr } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (fpSelectErr) {
    console.error('[POST /api/connections] family_profiles select:', fpSelectErr.message)
    return NextResponse.json({ error: 'Failed to load your profile.' }, { status: 500 })
  }

  let familyProfile = existingProfile

  if (!familyProfile) {
    const { data: created, error: fpInsertErr } = await supabase
      .from('family_profiles')
      .insert({ user_id: user.id })
      .select('id')
      .single()

    if (fpInsertErr || !created) {
      console.error('[POST /api/connections] family_profiles insert:', fpInsertErr?.message)
      return NextResponse.json(
        { error: 'Failed to set up your profile. Please try again.' },
        { status: 500 }
      )
    }

    familyProfile = created
  }

  // ── 5. Insert connection ───────────────────────────────────────────────────

  const { error: connErr } = await supabase
    .from('connections')
    .insert({
      family_id:     familyProfile.id,
      doula_id:      doulaProfileId,
      reaction_note: reactionNote.trim(),
      status:        'pending',
    })

  if (connErr) {
    // Unique constraint — already sent, treat as success
    if (connErr.code === '23505') {
      return NextResponse.json({ success: true, alreadyExists: true })
    }
    console.error('[POST /api/connections] connection insert:', connErr.message, connErr.code)
    return NextResponse.json({ error: connErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
