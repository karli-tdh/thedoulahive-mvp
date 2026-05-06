'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { Baby, CurrencyGbp, Heart, MapPin, Star, UserSound, VideoCamera, type Icon as PhosphorIcon } from '@phosphor-icons/react'

// MuxPlayer — SSR off (uses browser APIs)
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

// ── Types ────────────────────────────────────────────────────────────────────

export interface DoulaListItem {
  id: string
  tagline: string | null
  support_types: string[] | null
  birth_settings: string[] | null
  specialisms: string[] | null
  languages: string[] | null
  price_range: string | null
  intro_video_id: string | null
  circle_verified: boolean | null
  profiles: { full_name: string | null; location: string | null } | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function shortSetting(s: string) {
  if (s.toLowerCase().includes('mlu') || s.toLowerCase().includes('midwife')) return 'MLU'
  return s
}

/** Arinoe all-caps small label — pass a Tailwind text-colour class via className */
function SectionLabel({ children, className = 'text-dark-green/50', icon: Icon, iconClass }: {
  children: React.ReactNode
  className?: string
  icon?: PhosphorIcon
  iconClass?: string
}) {
  return (
    <div className={`flex items-center gap-1 font-arinoe text-[10px] uppercase tracking-[0.14em] ${className}`}>
      {Icon && <Icon size={11} weight="duotone" className={iconClass ?? ''} aria-hidden />}
      {children}
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function DoulaCard({ doula }: { doula: DoulaListItem }) {
  const [playing, setPlaying] = useState(false)

  const name           = doula.profiles?.full_name ?? 'Doula'
  const location       = doula.profiles?.location
  const topSpecialisms = (doula.specialisms ?? []).slice(0, 3)
  const extraCount     = Math.max(0, (doula.specialisms?.length ?? 0) - 3)
  const hasSupportType  = (doula.support_types?.length ?? 0) > 0
  const hasBirthSetting = (doula.birth_settings?.length ?? 0) > 0
  const hasSpecialisms  = topSpecialisms.length > 0

  return (
    <article className="flex flex-col rounded-2xl border-2 border-dark-green bg-cotton overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-[2px_2px_0px_#07403B] hover:shadow-[4px_4px_0px_#07403B]">

      {/* ── Portrait video / thumbnail ──────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '9/16' }}>

        {playing && doula.intro_video_id ? (
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
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play ${name}'s intro video`}
          >
            <Image
              src={`https://image.mux.com/${doula.intro_video_id}/thumbnail.jpg?time=0&width=480&fit_mode=smartcrop&height=853`}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cotton shadow-lg ring-2 ring-dark-green/20 transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-0.5 text-dark-green" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-cotton">
            <VideoCamera size={48} weight="duotone" className="text-dark-green/20" aria-hidden />
          </div>
        )}

      </div>

      {/* ── Card content ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">

        {/* Name + verified badge */}
        <div className="flex items-center gap-1.5">
          <p className="font-arinoe text-lg font-bold text-dark-green">{name}</p>
          {doula.circle_verified && (
            <span className="group/badge relative inline-flex h-[18px] w-[16px] shrink-0 cursor-default items-center justify-center">
              <svg viewBox="0 0 980.68 1080" className="absolute inset-0 h-full w-full" aria-hidden>
                <path
                  fill="#FFE404"
                  d="M884.66,265.76L523.27,57.11c-23.22-13.41-51.83-13.41-75.06,0L86.82,265.76
                     c-23.22,13.41-37.53,38.19-37.53,65v417.3c0,26.82,14.31,51.59,37.53,65
                     l361.4,208.65c23.22,13.41,51.83,13.41,75.06,0l361.39-208.65
                     c23.22-13.41,37.53-38.19,37.53-65v-417.3
                     c0-26.81-14.31-51.59-37.53-65Z"
                />
              </svg>
              <span className="relative text-[7px] font-bold leading-none text-dark-green">✓</span>
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-dark-green px-2.5 py-1 text-[10px] font-abel text-cotton opacity-0 shadow-md transition-opacity group-hover/badge:opacity-100">
                Verified Hive member
              </span>
            </span>
          )}
        </div>

        {/* Icon attribute row — location + price */}
        <div className="flex flex-col gap-1">
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} weight="duotone" className="shrink-0 text-[#FE7040]" aria-hidden />
              <span className="text-sm font-abel text-dark-green/70">{location}</span>
            </div>
          )}
          {doula.price_range && (
            <div className="flex items-center gap-1.5">
              <CurrencyGbp size={13} weight="duotone" className="shrink-0 text-olive" aria-hidden />
              <span className="text-sm font-abel text-dark-green/70">From {doula.price_range}</span>
            </div>
          )}
        </div>

        {/* In her words */}
        {doula.tagline && (
          <div className="space-y-1">
            <SectionLabel className="text-dark-green/50">In her words</SectionLabel>
            <blockquote className="border-l-[3px] border-[#F693C1] pl-3 text-sm font-abel font-medium leading-snug text-dark-green">
              {doula.tagline}
            </blockquote>
          </div>
        )}

        {/* Support type */}
        {hasSupportType && (
          <div className="space-y-1.5">
            <SectionLabel icon={Heart} iconClass="text-[#F693C1]" className="text-[#F693C1]">Support type</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {doula.support_types!.map((t) => (
                <span key={t} className="rounded-full bg-[#F693C1] px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Birth setting */}
        {hasBirthSetting && (
          <div className="space-y-1.5">
            <SectionLabel icon={Baby} iconClass="text-[#90EBD2]" className="text-[#90EBD2]">Birth setting</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {doula.birth_settings!.map((s) => (
                <span key={s} className="rounded-full bg-[#90EBD2] px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green">
                  {shortSetting(s)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Specialisms */}
        {hasSpecialisms && (
          <div className="space-y-1.5">
            <SectionLabel icon={Star} iconClass="text-olive" className="text-olive">Specialisms</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {topSpecialisms.map((s) => (
                <span key={s} className="rounded-full bg-olive px-2.5 py-0.5 text-xs font-abel font-medium text-cotton">
                  {s}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="rounded-full border border-dark-green/30 px-2.5 py-0.5 text-xs font-abel text-dark-green/50">
                  +{extraCount} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Languages */}
        {(doula.languages?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            <SectionLabel icon={UserSound} iconClass="text-[#FFE404]" className="text-[#FFE404]">Language</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {doula.languages!.slice(0, 2).map((l) => (
                <span key={l} className="rounded-full bg-[#FFE404] px-2.5 py-0.5 text-xs font-abel font-medium text-dark-green">
                  {l}
                </span>
              ))}
              {doula.languages!.length > 2 && (
                <span className="rounded-full border border-dark-green/30 px-2.5 py-0.5 text-xs font-abel text-dark-green/50">
                  +{doula.languages!.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* View profile — full-width pill, pushed to bottom */}
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
