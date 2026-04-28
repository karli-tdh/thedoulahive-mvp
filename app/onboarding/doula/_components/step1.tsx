import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldWrapper } from './field-wrapper'
import type { FormData, FormErrors } from '../types'

interface Step1Props {
  data: FormData
  onChange: (field: keyof FormData, value: string) => void
  errors: FormErrors
}

export function Step1({ data, onChange, errors }: Step1Props) {
  return (
    <div className="space-y-6">
      <FieldWrapper
        label="Name"
        helper="This is the name families will see on your profile and in messages."
        required
        error={errors.full_name}
      >
        <Input
          placeholder="e.g. Aisha Khan"
          value={data.full_name}
          onChange={(e) => onChange('full_name', e.target.value)}
          aria-invalid={!!errors.full_name}
        />
      </FieldWrapper>

      <FieldWrapper
        label="Base location"
        helper="Helps families understand where you're based — and whether you're local to them."
        required
        error={errors.location}
      >
        <Input
          placeholder="e.g. Leeds · West Yorkshire"
          value={data.location}
          onChange={(e) => onChange('location', e.target.value)}
          aria-invalid={!!errors.location}
        />
      </FieldWrapper>

      <FieldWrapper
        label="One-line summary"
        helper="A clear line helps the right families click in — and the wrong ones move on."
        required
        error={errors.tagline}
      >
        <Input
          placeholder="e.g. Practical, calm birth support for first-time parents in Leeds"
          value={data.tagline}
          onChange={(e) => onChange('tagline', e.target.value)}
          aria-invalid={!!errors.tagline}
        />
      </FieldWrapper>

      <FieldWrapper
        label="About your work"
        helper="Most families will read this before they reach out. Be specific about who you support and how you work."
      >
        <Textarea
          placeholder="What you offer, how you work, who you're a strong fit for. Keep it clear and specific."
          value={data.bio}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={6}
        />
      </FieldWrapper>
    </div>
  )
}
