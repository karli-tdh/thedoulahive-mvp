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

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ label, variant = 'primary' }: { label: string; variant?: 'primary' | 'muted' | 'outline' }) {
  const styles = {
    primary: 'bg-primary/10 text-primary',
    muted:   'bg-muted text-muted-foreground',
    outline: 'border border-border text-foreground/70',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string | string[] | number | null | undefined }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null

  const display = Array.isArray(value) ? value.join(', ') : String(value)
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm font-medium text-foreground">{label}</dt>
      <dd className="text-sm text-muted-foreground">{display}</dd>
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
        <div className="mb-10 overflow-hidden rounded-2xl">
          <VideoPlayer playbackId={doula.intro_video_id} />
        </div>
      )}

      {/* ── 2. Name + location + tagline ───────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{name}</h1>
        {location && (
          <p className="mt-1 text-base text-muted-foreground">{location}</p>
        )}
        {doula.tagline && (
          <p className="mt-3 text-base text-foreground/80">{doula.tagline}</p>
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
          <h2 className="mb-3 text-lg font-semibold text-foreground">About my work</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
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
          <h2 className="mb-5 text-lg font-semibold text-foreground">Practice details</h2>

          {/* Badge groups first */}
          <div className="mb-6 space-y-4">
            {(doula.support_types?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Support type
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.support_types!.map((t: string) => (
                    <Badge key={t} label={t} variant="primary" />
                  ))}
                </div>
              </div>
            )}

            {(doula.birth_settings?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Birth settings
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.birth_settings!.map((s: string) => (
                    <Badge key={s} label={s} variant="muted" />
                  ))}
                </div>
              </div>
            )}

            {(doula.specialisms?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Specialisms
                </p>
                <div className="flex flex-wrap gap-2">
                  {doula.specialisms!.map((s: string) => (
                    <Badge key={s} label={s} variant="outline" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text rows */}
          <dl className="space-y-3 border-t border-border pt-5">
            <DetailRow label="Languages"         value={doula.languages} />
            <DetailRow label="Travel radius"     value={doula.travel_radius_km ? `${doula.travel_radius_km} km` : null} />
            <DetailRow label="Price range"       value={doula.price_range} />
            <DetailRow label="Availability"      value={doula.availability} />
            <DetailRow label="Training"          value={doula.training_body} />
            <DetailRow label="Clients supported" value={doula.clients_supported} />
          </dl>
        </section>
      )}

    </main>
  )
}
