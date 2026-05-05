import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BIRTH_SETTINGS } from '../types'
import type { FormData, FormErrors } from '../types'

interface Step1Props {
  data:     FormData
  errors:   FormErrors
  onChange: <K extends keyof FormData>(field: K, value: FormData[K]) => void
}

// Reusable label + helper + error wrapper
function Field({
  label,
  helper,
  error,
  required,
  children,
}: {
  label:    string
  helper?:  string
  error?:   string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export function Step1({ data, errors, onChange }: Step1Props) {
  return (
    <div className="space-y-8">

      {/* Due date */}
      <Field
        label="Baby's due date"
        helper="If you're not sure, pick your best estimate — you can update this anytime."
        error={errors.due_date}
        required
      >
        <Input
          type="date"
          value={data.due_date}
          onChange={(e) => onChange('due_date', e.target.value)}
          className="max-w-[220px]"
        />
      </Field>

      {/* Birth setting */}
      <Field
        label="Planned birth setting"
        helper="This just helps doulas understand what you're planning right now. It's completely okay if it changes."
        error={errors.birth_setting}
        required
      >
        <div className="space-y-2 pt-0.5">
          {BIRTH_SETTINGS.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2.5 py-0.5"
            >
              <input
                type="radio"
                name="birth_setting"
                value={option}
                checked={data.birth_setting === option}
                onChange={() => onChange('birth_setting', option)}
                className="h-4 w-4 shrink-0 accent-brand-orange"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      </Field>

      {/* What they want */}
      <Field
        label="What you're looking for"
        helper="This helps the right doulas recognise themselves. A few honest lines is plenty."
        error={errors.what_they_want}
        required
      >
        <Textarea
          value={data.what_they_want}
          onChange={(e) => onChange('what_they_want', e.target.value)}
          placeholder="e.g. Calm reassurance, practical support, someone who'll advocate for me, postpartum help, VBAC support…"
          rows={4}
        />
      </Field>

    </div>
  )
}
