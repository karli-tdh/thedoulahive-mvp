import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldWrapper } from './field-wrapper'
import { CheckboxGroup } from './checkbox-group'
import type { FormData, FormErrors } from '../types'

const EXPERIENCE_OPTIONS = [
  'Less than 5',
  '6–15',
  '16–40',
  '40–99',
  '100+',
]

const TRAINING_BODIES = [
  'DONA International',
  'Doula UK',
  'BirthBliss',
  'Nurturing Birth',
  'Not Certified',
  'Other',
]

const LANGUAGES = [
  'English',
  'Welsh',
  'British Sign Language (BSL)',
  'American Sign Language (ASL)',
  'Polish',
  'Punjabi',
  'Urdu',
  'Bengali',
  'Gujarati',
  'Arabic',
  'French',
  'Spanish',
  'Portuguese',
  'Romanian',
  'Italian',
  'Lithuanian',
  'Somali',
  'Turkish',
  'Yoruba',
  'Tamil',
  'Farsi (Persian)',
  'Kurdish',
  'Mandarin',
  'Cantonese',
  'Ukrainian',
  'Russian',
  'Other',
]

const SPECIALISMS = [
  'LGBTQ+ support',
  'Twins & multiples experience',
  'Neurodiversity-affirming support',
  'Miscarriage & infant loss support',
  'Pregnancy after loss support',
  'Support for abortion',
  'Surrogates & intended parents',
  'Fertility support',
  'Postnatal overnight support',
  'VBAC',
]

const SUPPORT_TYPES = ['Birth', 'Postpartum', 'Both']

const BIRTH_SETTINGS = ['Home', 'Midwife-led unit (MLU)', 'Hospital']

interface Step2Props {
  data: FormData
  onChange: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  errors: FormErrors
}

export function Step2({ data, onChange }: Step2Props) {
  return (
    <div className="space-y-8">
      {/* Clients supported */}
      <FieldWrapper
        label="Clients supported"
        helper="Count all families you've supported — birth, postnatal, or both."
      >
        <div className="space-y-1">
          {EXPERIENCE_OPTIONS.map((option) => {
            const selected = data.clients_supported === option
            return (
              <label key={option} className="flex cursor-pointer items-center gap-2.5 py-0.5">
                <div className="relative h-4 w-4 shrink-0">
                  <input
                    type="radio"
                    name="clients_supported"
                    value={option}
                    checked={selected}
                    onChange={() => onChange('clients_supported', option)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  {/* Custom radio visual */}
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150 ${
                    selected ? 'border-brand-orange bg-cotton' : 'border-border bg-cotton'
                  }`}>
                    {selected && (
                      <div className="h-2 w-2 rounded-full bg-brand-orange" />
                    )}
                  </div>
                </div>
                <span className="text-sm">{option}</span>
              </label>
            )
          })}
        </div>
      </FieldWrapper>

      {/* Training */}
      <FieldWrapper
        label="Training organisation(s)"
        helper="Select where you trained. Choose Not Certified or Other if none apply."
      >
        <CheckboxGroup
          options={TRAINING_BODIES}
          selected={data.training_body}
          onChange={(v) => onChange('training_body', v)}
        />
      </FieldWrapper>

      {/* Languages */}
      <FieldWrapper
        label="Languages"
        helper="Select every language you can confidently support a client in."
      >
        <CheckboxGroup
          options={LANGUAGES}
          selected={data.languages}
          onChange={(v) => onChange('languages', v)}
          searchable
        />
      </FieldWrapper>

      {/* Specialisms */}
      <FieldWrapper
        label="Support specialisms"
        helper="Pick the areas where you're genuinely confident — not a wishlist. Families filter by these."
      >
        <CheckboxGroup
          options={SPECIALISMS}
          selected={data.specialisms}
          onChange={(v) => onChange('specialisms', v)}
        />
        <div className="mt-3 border-t border-border/40 pt-3">
          <button
            type="button"
            onClick={() => onChange('specialisms', [])}
            className={`flex items-center gap-2.5 text-sm transition-colors ${
              data.specialisms.length === 0
                ? 'font-medium text-dark-green'
                : 'text-dark-green/50 hover:text-dark-green'
            }`}
          >
            {/* Checkbox visual — checked when nothing selected */}
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
              data.specialisms.length === 0
                ? 'border-brand-orange bg-brand-orange'
                : 'border-border bg-cotton'
            }`}>
              {data.specialisms.length === 0 && (
                <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5" aria-hidden>
                  <path d="M1 4l2.5 2.5L9 1" stroke="#07403B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            None of these apply
          </button>
        </div>
      </FieldWrapper>

      {/* Support type */}
      <FieldWrapper
        label="Support type"
        helper="Controls how you appear in search. Choose everything that applies to your current practice."
      >
        <CheckboxGroup
          options={SUPPORT_TYPES}
          selected={data.support_types}
          onChange={(v) => onChange('support_types', v)}
        />
      </FieldWrapper>

      {/* Birth settings */}
      <FieldWrapper
        label="Birth settings"
        helper="Select every setting you're comfortable working in. Families check this before they connect."
      >
        <CheckboxGroup
          options={BIRTH_SETTINGS}
          selected={data.birth_settings}
          onChange={(v) => onChange('birth_settings', v)}
        />
      </FieldWrapper>

      {/* Travel radius */}
      <FieldWrapper
        label="Travel radius (km)"
        helper="Families near the edge of your radius will see your profile. Set what's realistic."
      >
        <Input
          type="number"
          placeholder="e.g. 20"
          value={data.travel_radius_km}
          onChange={(e) => onChange('travel_radius_km', e.target.value)}
          min={0}
          max={500}
          className="max-w-[140px]"
        />
      </FieldWrapper>

      {/* Price range */}
      <FieldWrapper
        label="Price range"
        helper="Families need a sense of budget before they reach out. A range is fine."
      >
        <Input
          placeholder="e.g. £900–£1,400"
          value={data.price_range}
          onChange={(e) => onChange('price_range', e.target.value)}
        />
      </FieldWrapper>

      {/* Availability */}
      <FieldWrapper
        label="Availability"
        helper="Be specific — due dates, months, capacity limits. Accurate availability builds trust."
      >
        <Textarea
          placeholder="e.g. Taking EDDs Aug–Dec 2026 · Limited weekend cover"
          value={data.availability}
          onChange={(e) => onChange('availability', e.target.value)}
          rows={3}
        />
      </FieldWrapper>
    </div>
  )
}
