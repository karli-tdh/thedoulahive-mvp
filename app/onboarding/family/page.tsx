'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Step1 } from './_components/step1'
import { Step2 } from './_components/step2'
import { INITIAL_FORM_DATA } from './types'
import type { FormData, FormErrors } from './types'

const TOTAL_STEPS = 2
const STEP_LABELS = ['The essentials', 'A little more']

// ── Helpers ───────────────────────────────────────────────────────────────────

function nullToEmpty(v: string | null | undefined): string { return v ?? '' }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FamilyOnboardingPage() {
  const router = useRouter()

  const [step, setStep]         = useState(1)
  const [data, setData]         = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors]     = useState<FormErrors>({})
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Load existing data ────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: fp }, { data: profileRow }] = await Promise.all([
        supabase.from('family_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      ])

      setData((prev) => ({
        ...prev,
        full_name: nullToEmpty(profileRow?.full_name),
        ...(fp ? {
          due_date:        nullToEmpty(fp.due_date),
          birth_setting:   nullToEmpty(fp.birth_setting),
          what_they_want:  nullToEmpty(fp.what_they_want),
          pregnancy_notes: nullToEmpty(fp.pregnancy_notes),
          intro_video_url: nullToEmpty(fp.intro_video_url),
          intro_video_id:  nullToEmpty(fp.intro_video_id),
        } : {}),
      }))

      setLoading(false)
    }
    load()
  }, [router])

  // ── Field change handler ──────────────────────────────────────────────────

  function handleChange<K extends keyof FormData>(field: K, value: FormData[K]) {
    setData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const next: FormErrors = {}
    if (!data.full_name.trim())      next.full_name      = 'Please add your name.'
    if (!data.due_date)              next.due_date       = 'Please add your due date.'
    if (!data.birth_setting)         next.birth_setting  = 'Please choose a birth setting.'
    if (!data.what_they_want.trim()) next.what_they_want = "Please tell us what you're looking for."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── Save step 1 ───────────────────────────────────────────────────────────

  async function saveStep1() {
    if (!validateStep1()) return
    setSaving(true); setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [fpResult, profileResult] = await Promise.all([
      supabase.from('family_profiles').upsert(
        {
          user_id:        user.id,
          due_date:       data.due_date       || null,
          birth_setting:  data.birth_setting  || null,
          what_they_want: data.what_they_want.trim() || null,
        },
        { onConflict: 'user_id' }
      ),
      supabase.from('profiles').update(
        { full_name: data.full_name.trim() || null }
      ).eq('id', user.id),
    ])

    const error = fpResult.error ?? profileResult.error
    if (error) { setSaveError(error.message); setSaving(false); return }
    setSaving(false); setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Save step 2 + finish ──────────────────────────────────────────────────

  async function saveStep2() {
    setSaving(true); setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('family_profiles').upsert(
      {
        user_id:         user.id,
        pregnancy_notes: data.pregnancy_notes.trim() || null,
        intro_video_url: data.intro_video_url || null,
        intro_video_id:  data.intro_video_id  || null,
      },
      { onConflict: 'user_id' }
    )

    if (error) { setSaveError(error.message); setSaving(false); return }
    router.push('/doulas?welcome=true')
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cotton">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-dark-green" />
      </main>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-cotton px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs font-abel text-muted-foreground">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{STEP_LABELS[step - 1]}</span>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-brand-orange' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-8 font-arinoe text-4xl text-dark-green sm:text-5xl">
          {step === 1 ? 'Tell us about your pregnancy' : 'A little more about you'}
        </h1>

        {/* Error banner */}
        {saveError && (
          <div className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-abel text-destructive">
            {saveError}
          </div>
        )}

        {/* Step content */}
        {step === 1 && <Step1 data={data} errors={errors} onChange={handleChange} />}
        {step === 2 && (
          <Step2
            data={data}
            errors={errors}
            onChange={handleChange}
            onSkipVideo={saveStep2}
          />
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={saving}
              className="rounded-xl border-2 border-dark-green px-5 py-2.5 text-sm font-abel font-medium text-dark-green hover:bg-dark-green hover:text-cotton transition-colors disabled:opacity-40"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={step === 1 ? saveStep1 : saveStep2}
            disabled={saving}
            className="rounded-xl bg-dark-green px-6 py-2.5 text-sm font-abel font-medium text-cotton transition-colors duration-200 hover:bg-brand-orange disabled:opacity-40"
          >
            {saving
              ? 'Saving…'
              : step === TOTAL_STEPS
              ? 'Find my doula'
              : 'Continue'}
          </button>
        </div>

      </div>
    </main>
  )
}
