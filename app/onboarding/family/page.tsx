'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Step1 } from './_components/step1'
import { Step2 } from './_components/step2'
import { INITIAL_FORM_DATA } from './types'
import type { FormData, FormErrors } from './types'

const TOTAL_STEPS = 2

// ── Helpers ───────────────────────────────────────────────────────────────────

function nullToEmpty(v: string | null | undefined): string {
  return v ?? ''
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FamilyOnboardingPage() {
  const router = useRouter()

  const [step, setStep]         = useState(1)
  const [data, setData]         = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors]     = useState<FormErrors>({})
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Load existing data on mount ────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: fp } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fp) {
        setData({
          due_date:        nullToEmpty(fp.due_date),
          birth_setting:   nullToEmpty(fp.birth_setting),
          what_they_want:  nullToEmpty(fp.what_they_want),
          pregnancy_notes: nullToEmpty(fp.pregnancy_notes),
          intro_video_url: nullToEmpty(fp.intro_video_url),
          intro_video_id:  nullToEmpty(fp.intro_video_id),
        })
      }

      setLoading(false)
    }
    load()
  }, [router])

  // ── Field change handler ───────────────────────────────────────────────────

  function handleChange<K extends keyof FormData>(field: K, value: FormData[K]) {
    setData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const next: FormErrors = {}
    if (!data.due_date)       next.due_date       = 'Please add your due date.'
    if (!data.birth_setting)  next.birth_setting  = 'Please choose a birth setting.'
    if (!data.what_they_want.trim()) next.what_they_want = 'Please tell us what you\'re looking for.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── Save step 1 ────────────────────────────────────────────────────────────

  async function saveStep1() {
    if (!validateStep1()) return
    setSaving(true)
    setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('family_profiles')
      .upsert(
        {
          user_id:       user.id,
          due_date:      data.due_date       || null,
          birth_setting: data.birth_setting  || null,
          what_they_want: data.what_they_want.trim() || null,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Save step 2 + finish ───────────────────────────────────────────────────

  async function saveStep2() {
    setSaving(true)
    setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('family_profiles')
      .upsert(
        {
          user_id:         user.id,
          pregnancy_notes: data.pregnancy_notes.trim() || null,
          intro_video_url: data.intro_video_url || null,
          intro_video_id:  data.intro_video_id  || null,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    router.push('/doulas?welcome=true')
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </main>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{step === 1 ? 'The essentials' : 'A little more'}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-8 text-2xl font-semibold text-foreground sm:text-3xl">
          {step === 1 ? 'Tell us about your pregnancy' : 'A little more about you'}
        </h1>

        {/* Error banner */}
        {saveError && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        {/* Step content */}
        {step === 1 && (
          <Step1 data={data} errors={errors} onChange={handleChange} />
        )}
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
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={step === 1 ? saveStep1 : saveStep2}
            disabled={saving}
            className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
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
