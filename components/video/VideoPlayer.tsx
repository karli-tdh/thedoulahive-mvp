'use client'

import dynamic from 'next/dynamic'

// MuxPlayer uses browser APIs — SSR must be off
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
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
    <div className="w-full overflow-hidden rounded-xl">
      {title && (
        <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
      )}
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
        style={{ width: '100%', aspectRatio: '16/9' }}
        accentColor="#000000"
      />
    </div>
  )
}
