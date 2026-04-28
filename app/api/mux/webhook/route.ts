import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mux } from '@/lib/mux/client'

/**
 * POST /api/mux/webhook
 *
 * Receives Mux webhook events and keeps doula_profiles in sync.
 * Handles: video.asset.ready
 *
 * Setup in Mux dashboard → Webhooks → add your URL:
 *   https://your-domain.vercel.app/api/mux/webhook
 *
 * Requires:
 *   MUX_WEBHOOK_SECRET   — from Mux dashboard after creating the webhook
 *   SUPABASE_SERVICE_ROLE_KEY — from Supabase Settings → API (bypasses RLS)
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET

  // Verify the Mux signature when the secret is configured
  if (webhookSecret) {
    try {
      mux.webhooks.verifySignature(
        rawBody,
        Object.fromEntries(request.headers.entries()),
        webhookSecret
      )
    } catch {
      console.error('[mux/webhook] Signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.type === 'video.asset.ready') {
    const asset = event.data
    const userId = asset.passthrough as string | undefined
    const playbackIds = asset.playback_ids as Array<{ id: string }> | undefined
    const playbackId = playbackIds?.[0]?.id

    if (!userId || !playbackId) {
      console.warn('[mux/webhook] Missing userId or playbackId — skipping')
      return NextResponse.json({ received: true })
    }

    // Use the service role key to bypass RLS — this request is from Mux, not a user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('doula_profiles')
      .update({
        intro_video_id: playbackId,
        intro_video_url: `https://stream.mux.com/${playbackId}.m3u8`,
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[mux/webhook] Supabase update failed:', error.message)
      // Return 200 so Mux doesn't keep retrying for DB errors
    } else {
      console.log(`[mux/webhook] Updated doula ${userId} with playback ${playbackId}`)
    }
  }

  return NextResponse.json({ received: true })
}
