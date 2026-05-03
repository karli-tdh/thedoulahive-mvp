'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from './VideoPlayer'
import type { AssetStatus } from '@/app/api/mux/status/route'

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'uploading' | 'processing' | 'ready' | 'error'

interface UploadState {
  phase: Phase
  progress: number       // 0–100 during upload
  uploadId: string | null
  playbackId: string | null
  assetId: string | null
  error: string | null
}

interface VideoUploaderProps {
  /** Pre-existing playback ID (e.g. loaded from doula_profiles) */
  existingPlaybackId?: string | null
  /** Called once the video is ready so the parent form can update its state */
  onVideoReady?: (playbackId: string, assetId: string) => void
  /**
   * When true the uploader skips saving the video to doula_profiles.
   * Use this when the video is being recorded for a message, not a profile.
   */
  skipProfilePersist?: boolean
  /** Called when the user resets/cancels the uploader */
  onReset?: () => void
}

const MAX_POLL_ATTEMPTS = 40   // 40 × 3 s = 2 minutes
const POLL_INTERVAL_MS  = 3000

// ── Component ────────────────────────────────────────────────────────────────

export function VideoUploader({ existingPlaybackId, onVideoReady, skipProfilePersist, onReset }: VideoUploaderProps) {
  const [state, setState] = useState<UploadState>({
    phase:      existingPlaybackId ? 'ready' : 'idle',
    progress:   0,
    uploadId:   null,
    playbackId: existingPlaybackId ?? null,
    assetId:    null,
    error:      null,
  })

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const xhrRef        = useRef<XMLHttpRequest | null>(null)
  const pollTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef  = useRef(0)

  // Keep playbackId in sync if the parent loads existing data after mount
  useEffect(() => {
    if (existingPlaybackId && state.phase === 'idle') {
      setState(prev => ({
        ...prev,
        phase: 'ready',
        playbackId: existingPlaybackId,
      }))
    }
  }, [existingPlaybackId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up on unmount
  useEffect(() => {
    return () => {
      xhrRef.current?.abort()
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setError(message: string) {
    setState(prev => ({ ...prev, phase: 'error', error: message }))
  }

  function reset() {
    xhrRef.current?.abort()
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    pollCountRef.current = 0
    setState({
      phase: 'idle', progress: 0,
      uploadId: null, playbackId: null, assetId: null, error: null,
    })
    onReset?.()
  }

  // ── Save to Supabase ───────────────────────────────────────────────────────

  async function persistVideoToProfile(playbackId: string) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('doula_profiles')
        .update({
          intro_video_id:  playbackId,
          intro_video_url: `https://stream.mux.com/${playbackId}.m3u8`,
        })
        .eq('user_id', user.id)
    } catch (err) {
      console.error('[VideoUploader] Failed to persist video:', err)
    }
  }

  // ── Polling ────────────────────────────────────────────────────────────────

  function startPolling(uploadId: string) {
    setState(prev => ({ ...prev, phase: 'processing', uploadId }))
    pollCountRef.current = 0

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(pollTimerRef.current!)
        setError('Video processing timed out. Please try uploading again.')
        return
      }

      try {
        const res  = await fetch(`/api/mux/status?uploadId=${uploadId}`)
        const data = (await res.json()) as AssetStatus

        if (data.status === 'ready') {
          clearInterval(pollTimerRef.current!)
          if (!skipProfilePersist) await persistVideoToProfile(data.playbackId)
          onVideoReady?.(data.playbackId, data.assetId)
          setState(prev => ({
            ...prev,
            phase:      'ready',
            playbackId: data.playbackId,
            assetId:    data.assetId,
          }))
        } else if (data.status === 'errored') {
          clearInterval(pollTimerRef.current!)
          setError(data.message ?? 'Video processing failed. Please try again.')
        }
        // 'processing' → keep polling
      } catch {
        // Network blip — keep polling, don't abort
      }
    }, POLL_INTERVAL_MS)
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      setError('Please choose a video file.')
      return
    }

    setState(prev => ({ ...prev, phase: 'uploading', progress: 0, error: null }))

    // 1. Get a direct upload URL from our API
    let uploadUrl: string
    let uploadId: string
    try {
      const res = await fetch('/api/mux/upload', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      uploadUrl = json.uploadUrl
      uploadId  = json.uploadId
    } catch (err) {
      setError('Could not start upload. Please check your connection and try again.')
      console.error('[VideoUploader] Failed to get upload URL:', err)
      return
    }

    // 2. Upload directly to Mux via XHR (fetch doesn't expose upload progress)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setState(prev => ({
            ...prev,
            progress: Math.round((e.loaded / e.total) * 100),
          }))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }

      xhr.onerror  = () => reject(new Error('Network error during upload'))
      xhr.onabort  = () => reject(new Error('Upload cancelled'))

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    }).catch((err: Error) => {
      if (err.message === 'Upload cancelled') return // user hit reset
      setError(`Upload failed: ${err.message}. Please try again.`)
      return
    })

    // If we errored above, state is already 'error'
    if (xhrRef.current?.status !== 0) {
      startPolling(uploadId)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset the input so the same file can be re-selected after an error
    e.target.value = ''
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const { phase, progress, playbackId, error } = state

  // Ready — show player + replace button
  if (phase === 'ready' && playbackId) {
    return (
      <div className="space-y-3">
        <VideoPlayer playbackId={playbackId} />
        <button
          type="button"
          onClick={reset}
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Replace video
        </button>
      </div>
    )
  }

  // Error
  if (phase === 'error') {
    return (
      <div className="rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 px-6 py-8 text-center">
        <p className="text-sm font-medium text-destructive mb-1">Upload failed</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity"
        >
          Try again
        </button>
      </div>
    )
  }

  // Uploading
  if (phase === 'uploading') {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-8">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Uploading…</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-4 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    )
  }

  // Processing
  if (phase === 'processing') {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center">
          {/* Spinner */}
          <svg
            className="h-8 w-8 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">Processing your video…</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This usually takes 1–2 minutes. You can leave this page — your progress is saved.
        </p>
      </div>
    )
  }

  // Idle — file picker
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={onFileChange}
        className="sr-only"
        aria-label="Choose video file"
      />

      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        {/* Camera icon */}
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-muted-foreground"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={1.5}
          >
            <path
              strokeLinecap="round" strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>

        <p className="text-sm font-medium text-foreground">
          30 to 90 seconds. Be yourself.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          This is how families will meet you before they message.
        </p>

        <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity sm:w-auto"
          >
            Upload video
          </button>
          {/* Only shown on mobile — desktop browsers ignore the capture attribute */}
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('capture', 'user')
                fileInputRef.current.click()
                setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 500)
              }
            }}
            className="sm:hidden w-full rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Record video
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          MP4, MOV, or WebM · Max 2 GB
        </p>
      </div>
    </>
  )
}
