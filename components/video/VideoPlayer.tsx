'use client'

import dynamic from 'next/dynamic'

// MuxPlayer uses browser APIs — SSR must be off
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto w-full max-w-[320px] animate-pulse rounded-xl bg-muted"
      style={{ aspectRatio: '9/16' }}
    />
  ),
})

interface VideoPlayerProps {
  playbackId: string | null | undefined
  /** Optional: shown above the player */
  title?: string
}

export function VideoPlayer({ playbackId, title }: VideoPlayerProps) {
  if (!playbackId) return null

  return (
    <div className="flex w-full justify-center">
      {title && (
        <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
      )}
      {/* Container defines portrait shape; video fills it flush edge-to-edge */}
      <div
        className="w-full max-w-[320px] overflow-hidden rounded-xl"
        style={{ aspectRatio: '9/16' }}
      >
        <MuxPlayer
          playbackId={playbackId}
          streamType="on-demand"
          envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
          accentColor="#000000"
        />
      </div>
    </div>
  )
}
