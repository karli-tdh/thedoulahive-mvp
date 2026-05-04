import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { ConnectButton } from './_components/connect-button'

// ── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: { id: string }
}

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

  type ProfileShape = { full_name: string | null; location: string | null }
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

// ── Badge components (brand-coded) ───────────────────────────────────────────

function SupportBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-light-pink/30 border border-light-pink px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

function BirthSettingBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-light-blue/30 border border-light-blue px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

function SpecialismBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-olive/15 border border-olive/50 px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

function TrainingBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-brand-orange/15 border border-brand-orange/40 px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

function LanguageBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-soft-yellow/60 border border-soft-yellow px-3 py-1 text-xs font-abel font-medium text-dark-green">
      {label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string | string[] | number | null | undefined }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null

  const display = Array.isArray(value) ? value.join(', ') : String(value)
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm font-abel font-medium text-dark-green">{label}</dt>
      <dd className="text-sm font-abel text-muted-foreground">{display}</dd>
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

  type ProfileShape = { full_name: string | null; location: string | null }
  const profile  = doula.profiles as unknown as ProfileShape | null
  const name     = profile?.full_name ?? 'Doula'
  const location = profile?.location

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

      {/* ── 1. Intro video ─────────────────────────────────────────────── */}
      {doula.intro_video_id && (
        <div className="mb-10 overflow-hidden rounded-xl border-2 border-dark-green">
          <VideoPlayer playbackId={doula.intro_video_id} />
        </div>
      )}

      {/* ── 2. Name + location + tagline ───────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-arinoe text-4xl text-dark-green sm:text-5xl">{name}</h1>
        {location && (
          <p className="mt-2 text-base font-abel text-muted-foreground">{location}</p>
        )}
        {doula.tagline && (
          <p className="mt-3 text-base font-abel text-dark-green/80">{doula.tagline}</p>
        )}
      </div>

      {/* ── 3. Connect button ──────────────────────────────────────────── */}
      <div className="mb-10">
        <ConnectButton
          doulaProfileId={doula.id}
          doulaName={name}
          returnPath={`/doulas/${doula.id}`}
        />
      </div>

      {/* ── 4. Bio ─────────────────────────────────────────────────────── */}
      {doula.bio && (
        <section className="mb-10">
          <h2 className="mb-3 font-arinoe text-2xl text-dark-green">About my work</h2>
          <p className="whitespace-pre-line text-sm font-abel leading-relaxed text-dark-green/80">
            {doula.bio}
          </p>
        </section>
      )}

      {/* ── 5. Practice details ────────────────────────────────────────── */}
      {(
        (doula.support_types?.length ?? 0) > 0 ||
        (doula.birth_settings?.length ?? 0) > 0 ||
        (doula.specialisms?.length ?? 0) > 0 ||
        (doula.languages?.length ?? 0) > 0 ||
        doula.travel_radius_km ||
        doula.price_range ||
        doula.availability ||
        (doula.training_body?.length ?? 0) > 0 ||
        doula.clients_supported
      ) && (
        <section>
          <h2 className="mb-5 font-arinoe text-2xl text-dark-green">Practice details</h2>

          {/* Badge groups */}
          <div className="mb-6 space-y-5">
            {(doula.support_types?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-abel font-medium uppercase tracking-wide text-muted-foreground">
                  Support type
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.support_types!.map((t: string) => (
                    <SupportBadge key={t} label={t} />
                  ))}
                </div>
              </div>
            )}

            {(doula.birth_settings?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-abel font-medium uppercase tracking-wide text-muted-foreground">
                  Birth settings
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.birth_settings!.map((s: string) => (
                    <BirthSettingBadge key={s} label={s} />
                  ))}
                </div>
              </div>
            )}

            {(doula.specialisms?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-abel font-medium uppercase tracking-wide text-muted-foreground">
                  Specialisms
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.specialisms!.map((s: string) => (
                    <SpecialismBadge key={s} label={s} />
                  ))}
                </div>
              </div>
            )}

            {(doula.training_body?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-abel font-medium uppercase tracking-wide text-muted-foreground">
                  Training
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.training_body!.map((t: string) => (
                    <TrainingBadge key={t} label={t} />
                  ))}
                </div>
              </div>
            )}

            {(doula.languages?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-abel font-medium uppercase tracking-wide text-muted-foreground">
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.languages!.map((l: string) => (
                    <LanguageBadge key={l} label={l} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text rows */}
          <dl className="space-y-3 border-t-2 border-dark-green/20 pt-5">
            <DetailRow label="Travel radius"     value={doula.travel_radius_km ? `${doula.travel_radius_km} km` : null} />
            <DetailRow label="Price range"       value={doula.price_range} />
            <DetailRow label="Availability"      value={doula.availability} />
            <DetailRow label="Clients supported" value={doula.clients_supported} />
          </dl>
        </section>
      )}

    </main>
  )
}
