import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import {
  MapPin,
  CurrencyGbp,
  Car,
  Users,
  CalendarBlank,
} from '@phosphor-icons/react/dist/ssr'
import { ConnectButton } from './_components/connect-button'

// ── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: { id: string }
}

type ProfileShape = { full_name: string | null; location: string | null }

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('doula_profiles')
    .select('tagline, support_types, profiles ( full_name, location )')
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'Doula | The Doula Hive' }

  const profile      = (data.profiles as unknown as ProfileShape | null)
  const name         = profile?.full_name ?? 'Doula'
  const location     = profile?.location
  const supportType  = data.support_types?.[0] ?? 'Birth'
  const locationPart = location ? ` in ${location}` : ''

  return {
    title:       `${name} — ${supportType} Doula${locationPart} | The Doula Hive`,
    description: data.tagline ?? `Connect with ${name} on The Doula Hive.`,
  }
}

// ── Small reusable label (Arinoe all-caps) ───────────────────────────────────

function SectionLabel({
  children,
  className = 'text-dark-green/50',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={`font-arinoe text-[11px] uppercase tracking-[0.14em] ${className}`}>
      {children}
    </p>
  )
}

// ── Badge components ──────────────────────────────────────────────────────────

function SupportBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#F693C1] px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

function BirthSettingBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#90EBD2] px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

function SpecialismBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-olive px-3 py-1 text-xs font-abel font-medium text-cotton">
      {label}
    </span>
  )
}

function TrainingBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-dark-green px-3 py-1 text-xs font-abel font-medium text-cotton">
      {label}
    </span>
  )
}

function LanguageBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#FFE404] px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

// ── Key facts icon row ────────────────────────────────────────────────────────

function FactRow({
  icon: Icon,
  iconClass,
  children,
}: {
  icon: React.ElementType
  iconClass: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon size={16} weight="duotone" className={`shrink-0 ${iconClass}`} aria-hidden />
      <span className="text-sm font-abel text-dark-green">{children}</span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DoulaProfilePage({ params }: PageProps) {
  const supabase = await createClient()

  const { data: doula } = await supabase
    .from('doula_profiles')
    .select(
      `id,
       user_id,
       tagline,
       bio,
       support_types,
       birth_settings,
       specialisms,
       languages,
       travel_radius_km,
       price_range,
       availability,
       training_body,
       clients_supported,
       intro_video_id,
       profiles ( full_name, location )`
    )
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (!doula) notFound()

  // Track profile view — authenticated, non-self viewers only
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.id !== doula.user_id) {
    try {
      await supabase
        .from('profile_views')
        .insert({ doula_id: doula.id, viewer_id: user.id })
    } catch {
      // silently ignore if table not yet migrated
    }
  }

  // Check for an existing connection so we can hide the sticky button
  let alreadyConnected = false
  if (user && user.id !== doula.user_id) {
    try {
      const { data: fp } = await supabase
        .from('family_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fp) {
        const { data: conn } = await supabase
          .from('connections')
          .select('id')
          .eq('doula_id', doula.id)
          .eq('family_id', fp.id)
          .maybeSingle()
        alreadyConnected = !!conn
      }
    } catch {
      // not critical — default to false
    }
  }

  const profile  = doula.profiles as unknown as ProfileShape | null
  const name     = profile?.full_name ?? 'Doula'
  const location = profile?.location

  // Which key-fact rows have data?
  const hasFactRow =
    doula.price_range ||
    doula.travel_radius_km ||
    doula.clients_supported ||
    doula.availability

  const hasPracticeDetails =
    (doula.support_types?.length ?? 0) > 0 ||
    (doula.birth_settings?.length ?? 0) > 0 ||
    (doula.specialisms?.length ?? 0) > 0 ||
    (doula.training_body?.length ?? 0) > 0 ||
    (doula.languages?.length ?? 0) > 0

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

      {/* ── Intro video ────────────────────────────────────────────────────── */}
      {doula.intro_video_id && (
        <div className="mb-10 overflow-hidden rounded-xl border-2 border-dark-green">
          <VideoPlayer playbackId={doula.intro_video_id} />
        </div>
      )}

      {/* ── Name ───────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-arinoe text-4xl text-dark-green sm:text-5xl">{name}</h1>

        {/* 3. Location with MapPin icon */}
        {location && (
          <div className="mt-2 flex items-center gap-1.5">
            <MapPin size={14} weight="duotone" className="shrink-0 text-[#FE7040]" aria-hidden />
            <span className="text-base font-abel text-dark-green/70">{location}</span>
          </div>
        )}

        {/* 4. Tagline — blockquote "IN HER WORDS" treatment */}
        {doula.tagline && (
          <div className="mt-5 space-y-1.5">
            <SectionLabel className="text-dark-green">In her words</SectionLabel>
            <blockquote className="border-l-[3px] border-[#F693C1] pl-4 font-abel text-lg font-medium leading-snug text-dark-green">
              {doula.tagline}
            </blockquote>
          </div>
        )}

        {/* 5. Key facts icon row */}
        {hasFactRow && (
          <div className="mt-6 divide-y divide-dark-green/10 rounded-xl border-2 border-dark-green/10 px-4">
            {doula.price_range && (
              <FactRow icon={CurrencyGbp} iconClass="text-olive">
                From {doula.price_range}
              </FactRow>
            )}
            {doula.travel_radius_km && (
              <FactRow icon={Car} iconClass="text-dark-green">
                {doula.travel_radius_km} km radius
              </FactRow>
            )}
            {doula.clients_supported && (
              <FactRow icon={Users} iconClass="text-dark-green">
                {doula.clients_supported} clients supported
              </FactRow>
            )}
            {doula.availability && (
              <FactRow icon={CalendarBlank} iconClass="text-dark-green">
                Available {doula.availability}
              </FactRow>
            )}
          </div>
        )}
      </div>

      {/* ── 6. Connect button ──────────────────────────────────────────────── */}
      <div className="mb-10">
        <ConnectButton
          doulaProfileId={doula.id}
          doulaName={name}
          returnPath={`/doulas/${doula.id}`}
          alreadyConnected={alreadyConnected}
        />
      </div>

      {/* ── About my work ──────────────────────────────────────────────────── */}
      {doula.bio && (
        <section className="mb-10">
          <h2 className="mb-3 font-arinoe text-2xl uppercase tracking-[0.08em] text-dark-green">
            About my work
          </h2>
          <p className="whitespace-pre-line text-sm font-abel leading-relaxed text-dark-green/80">
            {doula.bio}
          </p>
        </section>
      )}

      {/* ── Practice details ───────────────────────────────────────────────── */}
      {hasPracticeDetails && (
        <section>
          <h2 className="mb-5 font-arinoe text-2xl uppercase tracking-[0.08em] text-dark-green">
            Practise details
          </h2>

          <div className="space-y-6">

            {(doula.support_types?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <SectionLabel className="text-[#F693C1]">Support type</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {doula.support_types!.map((t: string) => (
                    <SupportBadge key={t} label={t} />
                  ))}
                </div>
              </div>
            )}

            {(doula.birth_settings?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <SectionLabel className="text-[#90EBD2]">Birth settings</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {doula.birth_settings!.map((s: string) => (
                    <BirthSettingBadge key={s} label={s} />
                  ))}
                </div>
              </div>
            )}

            {(doula.specialisms?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <SectionLabel className="text-olive">Specialisms</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {doula.specialisms!.map((s: string) => (
                    <SpecialismBadge key={s} label={s} />
                  ))}
                </div>
              </div>
            )}

            {(doula.training_body?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <SectionLabel className="text-dark-green">Training</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {doula.training_body!.map((t: string) => (
                    <TrainingBadge key={t} label={t} />
                  ))}
                </div>
              </div>
            )}

            {(doula.languages?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <SectionLabel className="text-[#FFE404]">Languages</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {doula.languages!.map((l: string) => (
                    <LanguageBadge key={l} label={l} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* Bottom padding so sticky button doesn't overlap last content */}
      <div className="h-20" aria-hidden />

    </main>
  )
}
