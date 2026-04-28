import { NextRequest, NextResponse } from 'next/server'
import { mux } from '@/lib/mux/client'

export type AssetStatus =
  | { status: 'processing' }
  | { status: 'ready'; playbackId: string; assetId: string }
  | { status: 'errored'; message: string }

/**
 * GET /api/mux/status?uploadId=xxx
 * Polls the status of a Mux direct upload and, once processing completes,
 * returns the playback_id and asset_id for the caller to save.
 *
 * Phases:
 *   upload  → waiting | asset_created | errored
 *   asset   → preparing | ready | errored
 */
export async function GET(request: NextRequest) {
  const uploadId = request.nextUrl.searchParams.get('uploadId')

  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 })
  }

  try {
    const upload = await mux.video.uploads.retrieve(uploadId)

    // Upload itself failed or timed out
    if (upload.status === 'errored' || upload.status === 'timed_out') {
      return NextResponse.json<AssetStatus>({
        status: 'errored',
        message: `Upload ${upload.status}`,
      })
    }

    // Upload is still receiving data
    if (upload.status !== 'asset_created' || !upload.asset_id) {
      return NextResponse.json<AssetStatus>({ status: 'processing' })
    }

    // Upload done — now check the asset
    const asset = await mux.video.assets.retrieve(upload.asset_id)

    if (asset.status === 'errored') {
      return NextResponse.json<AssetStatus>({
        status: 'errored',
        message: 'Video processing failed',
      })
    }

    if (asset.status !== 'ready') {
      return NextResponse.json<AssetStatus>({ status: 'processing' })
    }

    const playbackId = asset.playback_ids?.[0]?.id

    if (!playbackId) {
      return NextResponse.json<AssetStatus>({
        status: 'errored',
        message: 'No playback ID returned from Mux',
      })
    }

    return NextResponse.json<AssetStatus>({
      status: 'ready',
      playbackId,
      assetId: asset.id,
    })
  } catch (err) {
    console.error('[mux/status] Error checking status:', err)
    return NextResponse.json(
      { error: 'Failed to check video status' },
      { status: 500 }
    )
  }
}
