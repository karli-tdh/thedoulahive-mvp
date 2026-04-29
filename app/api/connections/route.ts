import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/connections
 * Creates a connection request from a family user to a doula.
 *
 * Body: { doulaProfileId: string, reactionNote: string }
 *
 * Delegates to the `create_connection` Postgres SECURITY DEFINER function
 * (migration 005) which handles get-or-create family_profiles and the
 * connections insert atomically, bypassing RLS fragility server-side.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // ── 1. Confirm auth (getUser validates JWT via Supabase Auth API) ──────────

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────

  let doulaProfileId: string
  let reactionNote: string
  try {
    const body     = await request.json()
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

  // ── 3. Call the SECURITY DEFINER RPC function ─────────────────────────────
  // This runs server-side in Postgres with the function owner's privileges,
  // bypassing RLS while still using auth.uid() from the JWT for identity.

  const { data: result, error: rpcErr } = await supabase.rpc('create_connection', {
    p_doula_profile_id: doulaProfileId,
    p_reaction_note:    reactionNote.trim(),
  })

  if (rpcErr) {
    console.error('[POST /api/connections] RPC error:', rpcErr.message)
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }

  // The function returns { success: true } or { error: '...' }
  if (result?.error) {
    console.error('[POST /api/connections] function error:', result.error)
    const status = result.error === 'Not authenticated'   ? 401
                 : result.error.includes('Only family')   ? 403
                 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ success: true })
}
