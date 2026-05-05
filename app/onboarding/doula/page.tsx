'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Step1 } from './_components/step1'
import { Step2 } from './_components/step2'
import { Step3 } from './_components/step3'
import { INITIAL_FORM_DATA } from './types'
import type { FormData, FormErrors } from './types'

const STEP_TITLES = ['About you', 'Your practice', 'Intro video']
const TOTAL_STEPS = 3

// ── Helpers ───────────────────────────────────────────────────────────────────

function nullToEmpty(v: string | null | undefined): string { return v ?? '' }
function nullToArray(v: string[] | null | undefined): string[] { return v ?? [] }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DoulaOnboardingPage() {
  const router = useRouter()

  const [step, setStep]         = useState(1)
  const [data, setData]         = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors]     = useState<FormErrors>({})
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Load existing profile ──────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { router.push('/login'); return }

      const [{ data: profile }, { data: doula }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('doula_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ])

      setData({
        full_name:        nullToEmpty(profile?.full_name),
        location:         nullToEmpty(profile?.location),
        tagline:          nullToEmpty(doula?.tagline),
        bio:              nullToEmpty(doula?.bio),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clients_supported: nullToEmpty((doula as any)?.clients_supported),
        training_body:    nullToArray(doula?.training_body),
        languages:        nullToArray(doula?.languages),
        specialisms:      nullToArray(doula?.specialisms),
        support_types:    nullToArray(doula?.support_types),
        birth_settings:   nullToArray(doula?.birth_settings),
        travel_radius_km: doula?.travel_radius_km?.toString() ?? '',
        price_range:      nullToEmpty(doula?.price_range),
        availability:     nullToEmpty(doula?.availability),
        intro_video_url:  nullToEmpty(doula?.intro_video_url),
        intro_video_id:   nullToEmpty(doula?.intro_video_id),
        is_published:     doula?.is_published ?? false,
      })

      setLoading(false)
    }
    load()
  }, [router])

  // ── Field change handler ──────────────────────────────────────────────────

  function handleChange<K extends keyof FormData>(field: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const next: FormErrors = {}
    if (!data.full_name.trim()) next.full_name = 'Your name is required.'
    if (!data.location.trim()) next.location   = 'Your base location is required.'
    if (!data.tagline.trim())  next.tagline    = 'A one-line summary is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── Save handlers ─────────────────────────────────────────────────────────

  async function saveStep1() {
    if (!validateStep1()) return
    setSaving(true); setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [profileResult, doulaResult] = await Promise.all([
      supabase.from('profiles').update({ full_name: data.full_name, location: data.location }).eq('id', user.id),
      supabase.from('doula_profiles').upsert(
        { user_id: user.id, tagline: data.tagline, bio: data.bio || null },
        { onConflict: 'user_id' }
      ),
    ])

    if (profileResult.error || doulaResult.error) {
      setSaveError(doulaResult.error?.message ?? profileResult.error?.message ?? 'Save failed')
      setSaving(false); return
    }

    setSaving(false); setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveStep2() {
    setSaving(true); setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('doula_profiles').upsert(
      {
        user_id:          user.id,
        clients_supported: data.clients_supported || null,
        training_body:    data.training_body.length ? data.training_body : null,
        languages:        data.languages.length    ? data.languages    : null,
        specialisms:      data.specialisms.length  ? data.specialisms  : null,
        support_types:    data.support_types.length ? data.support_types : null,
        birth_settings:   data.birth_settings.length ? data.birth_settings : null,
        travel_radius_km: data.travel_radius_km ? parseInt(data.travel_radius_km, 10) : null,
        price_range:      data.price_range || null,
        availability:     data.availability || null,
      },
      { onConflict: 'user_id' }
    )

    if (error) { setSaveError(error.message); setSaving(false); return }
    setSaving(false); setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveStep3() {
    setSaving(true); setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('doula_profiles').upsert(
      {
        user_id:         user.id,
        intro_video_url: data.intro_video_url || null,
        intro_video_id:  data.intro_video_id  || null,
        is_published:    data.is_published,
      },
      { onConflict: 'user_id' }
    )

    if (error) { setSaveError(error.message); setSaving(false); return }
    setSaving(false)
    router.push('/dashboard?saved=true')
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cotton">
        <p className="text-sm font-abel text-muted-foreground">Loading your profile…</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div className="min-h-screen bg-cotton">
      <div className="mx-auto max-w-xl px-4 py-10 pb-24">

        {/* Progress indicator */}
        <div className="mb-10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-abel text-dark-green">
              Step {step} of {TOTAL_STEPS} —{' '}
              <span className="text-muted-foreground">{STEP_TITLES[step - 1]}</span>
            </p>
            <p className="text-sm font-abel text-muted-foreground">{progressPct}%</p>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  i + 1 <= step ? 'bg-brand-orange' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        {step === 1 && <Step1 data={data} onChange={handleChange} errors={errors} />}
        {step === 2 && <Step2 data={data} onChange={handleChange} errors={errors} />}
        {step === 3 && <Step3 data={data} onChange={handleChange} errors={errors} />}

        {/* Save error */}
        {saveError && (
          <div className="mt-6 rounded-xl border-2 border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-abel text-destructive">
            Something went wrong: {saveError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={saving}
              className="rounded-xl border-2 border-dark-green px-5 py-2.5 text-sm font-abel font-medium text-dark-green transition-colors duration-200 hover:bg-dark-green hover:text-cotton disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={saveStep1}
              disabled={saving}
              className="rounded-xl bg-dark-green px-6 py-2.5 text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-brand-orange disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & continue'}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={saveStep2}
              disabled={saving}
              className="rounded-xl bg-dark-green px-6 py-2.5 text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-brand-orange disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & continue'}
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={saveStep3}
              disabled={saving}
              className="rounded-xl bg-dark-green px-6 py-2.5 text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-brand-orange disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
