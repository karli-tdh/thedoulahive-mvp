'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { VideoModal } from './video-modal'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DoulaListItem {
  id: string
  tagline: string | null
  support_types: string[] | null
  birth_settings: string[] | null
  specialisms: string[] | null
  price_range: string | null
  intro_video_id: string | null
  profiles: { full_name: string | null; location: string | null } | null
}

// Abbreviate long setting names for compact display
function shortSetting(s: string) {
  if (s.toLowerCase().includes('mlu') || s.toLowerCase().includes('midwife')) return 'MLU'
  return s
}

// ── Component ────────────────────────────────────────────────────────────────

export function DoulaCard({ doula }: { doula: DoulaListItem }) {
  const [showVideo, setShowVideo] = useState(false)

  const name     = doula.profiles?.full_name ?? 'Doula'
  const location = doula.profiles?.location
  const topSpecialisms = (doula.specialisms ?? []).slice(0, 3)
  const extraCount     = Math.max(0, (doula.specialisms?.length ?? 0) - 3)

  return (
    <>
      {showVideo && doula.intro_video_id && (
        <VideoModal
          playbackId={doula.intro_video_id}
          doulaName={name}
          onClose={() => setShowVideo(false)}
        />
      )}

      <article className="flex flex-col rounded-2xl border border-border bg-card hover:border-foreground/25 transition-colors overflow-hidden">

        {/* Thumbnail — clicking navigates to profile page */}
        <Link
          href={`/doulas/${doula.id}`}
          className="group relative block aspect-video w-full overflow-hidden bg-muted"
          tabIndex={-1}
          aria-hidden
        >
          {doula.intro_video_id ? (
            <>
              <Image
                src={`https://image.mux.com/${doula.intro_video_id}/thumbnail.jpg`}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {/* Decorative play badge — indicates video exists, but click goes to profile */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10">
                  {/* Play triangle — optically nudged right to look centred */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 translate-x-0.5 text-gray-800"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full w-full bg-muted/60" />
          )}
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">

          {/* Name + location */}
          <div>
            <Link
              href={`/doulas/${doula.id}`}
              className="font-semibold text-foreground hover:underline underline-offset-2"
            >
              {name}
            </Link>
            {location && (
              <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>
            )}
          </div>

          {/* Tagline */}
          {doula.tagline && (
            <p className="text-sm text-foreground/80 line-clamp-2">{doula.tagline}</p>
          )}

          {/* Support type + birth setting badges */}
          {((doula.support_types?.length ?? 0) > 0 || (doula.birth_settings?.length ?? 0) > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {doula.support_types?.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {t}
                </span>
              ))}
              {doula.birth_settings?.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {shortSetting(s)}
                </span>
              ))}
            </div>
          )}

          {/* Specialism tags */}
          {topSpecialisms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topSpecialisms.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground/70"
                >
                  {s}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                  +{extraCount} more
                </span>
              )}
            </div>
          )}

          {/* Footer: price + actions */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
            {doula.price_range ? (
              <span className="text-sm font-medium text-foreground">{doula.price_range}</span>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              {doula.intro_video_id && (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Watch intro
                </button>
              )}
              <Link
                href={`/doulas/${doula.id}`}
                className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
              >
                View profile
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
