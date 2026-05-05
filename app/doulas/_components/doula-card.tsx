'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, VideoCamera } from '@phosphor-icons/react'

// MuxPlayer — SSR off (uses browser APIs)
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function shortSetting(s: string) {
  if (s.toLowerCase().includes('mlu') || s.toLowerCase().includes('midwife')) return 'MLU'
  return s
}

// ── Component ────────────────────────────────────────────────────────────────

export function DoulaCard({ doula }: { doula: DoulaListItem }) {
  const [playing, setPlaying] = useState(false)

  const name           = doula.profiles?.full_name ?? 'Doula'
  const location       = doula.profiles?.location
  const topSpecialisms = (doula.specialisms ?? []).slice(0, 3)
  const extraCount     = Math.max(0, (doula.specialisms?.length ?? 0) - 3)

  return (
    <article className="flex flex-col rounded-2xl border-2 border-dark-green bg-cotton overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-[2px_2px_0px_#07403B] hover:shadow-[4px_4px_0px_#07403B]">

      {/* ── Portrait video / thumbnail ──────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '9/16' }}>

        {playing && doula.intro_video_id ? (
          /* Inline player fills the portrait container edge-to-edge */
          <div className="absolute inset-0">
            <MuxPlayer
              playbackId={doula.intro_video_id}
              streamType="on-demand"
              envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
              autoPlay
              style={{ width: '100%', height: '100%' }}
              accentColor="#FE7040"
            />
          </div>
        ) : doula.intro_video_id ? (
          /* Thumbnail with centred play button */
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 w-full h-full"
            aria-label={`Play ${name}'s intro video`}
          >
            <Image
              src={`https://image.mux.com/${doula.intro_video_id}/thumbnail.jpg?time=0&width=480&fit_mode=smartcrop&height=853`}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
            {/* Overlay + play circle */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cotton shadow-lg ring-2 ring-dark-green/20 transition-transform group-hover:scale-105">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-7 w-7 translate-x-0.5 text-dark-green"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          /* No video — cotton placeholder */
          <div className="absolute inset-0 flex items-center justify-center bg-cotton">
            <VideoCamera size={48} weight="duotone" className="text-dark-green/20" aria-hidden />
          </div>
        )}

      </div>

      {/* ── Card content ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-5">

        {/* Name */}
        <p className="font-arinoe text-xl font-bold text-dark-green">{name}</p>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={13} weight="duotone" className="shrink-0 text-[#FE7040]" aria-hidden />
            <span className="text-sm font-abel text-dark-green/70">{location}</span>
          </div>
        )}

        {/* Tagline — blockquote prompt style */}
        {doula.tagline && (
          <blockquote className="border-l-[3px] border-[#F693C1] pl-3 text-base font-abel font-medium leading-snug text-dark-green">
            {doula.tagline}
          </blockquote>
        )}

        {/* Pills */}
        {((doula.support_types?.length ?? 0) > 0 ||
          (doula.birth_settings?.length ?? 0) > 0 ||
          topSpecialisms.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {/* Support type — light pink */}
            {doula.support_types?.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#F693C1] px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green"
              >
                {t}
              </span>
            ))}
            {/* Birth setting — light blue */}
            {doula.birth_settings?.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[#90EBD2] px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green"
              >
                {shortSetting(s)}
              </span>
            ))}
            {/* Specialisms — olive */}
            {topSpecialisms.map((s) => (
              <span
                key={s}
                className="rounded-full bg-olive px-2.5 py-0.5 text-xs font-abel font-medium text-cotton"
              >
                {s}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="rounded-full border border-dark-green/30 px-2.5 py-0.5 text-xs font-abel text-dark-green/50">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {doula.price_range && (
          <p className="text-sm font-abel text-dark-green/80">
            <span className="mr-0.5 text-xs text-dark-green/40">£</span>
            {doula.price_range}
          </p>
        )}

        {/* View profile — full-width pill */}
        <div className="mt-auto pt-3">
          <Link
            href={`/doulas/${doula.id}`}
            className="block w-full rounded-full bg-dark-green py-2.5 text-center text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-[#F55CB1]"
          >
            View profile
          </Link>
        </div>

      </div>
    </article>
  )
}
