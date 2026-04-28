import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mux } from '@/lib/mux/client'

/**
 * POST /api/mux/upload
 * Creates a Mux direct upload URL for the authenticated doula.
 * Returns { uploadUrl, uploadId } to the client.
 * The client PUTs the video file directly to uploadUrl (never through our server).
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const upload = await mux.video.uploads.create({
      // Allow uploads from localhost and any Vercel preview URL.
      // In production, lock this down to your specific domain.
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        // passthrough lets the webhook identify which user owns this video
        passthrough: user.id,
      },
    })

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    })
  } catch (err) {
    console.error('[mux/upload] Error creating upload:', err)
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}
