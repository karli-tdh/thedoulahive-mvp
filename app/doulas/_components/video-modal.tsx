'use client'

import { useEffect } from 'react'
import { VideoPlayer } from '@/components/video/VideoPlayer'

interface VideoModalProps {
  playbackId: string
  doulaName: string
  onClose: () => void
}

export function VideoModal({ playbackId, doulaName, onClose }: VideoModalProps) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8"
      onClick={onClose}
    >
      {/* Panel — stop click from closing */}
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close row */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-white/70">{doulaName}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            Close
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <VideoPlayer playbackId={playbackId} />
      </div>
    </div>
  )
}
