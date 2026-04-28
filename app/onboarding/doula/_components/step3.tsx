import { FieldWrapper } from './field-wrapper'
import { Toggle } from './toggle'
import type { FormData, FormErrors } from '../types'

interface Step3Props {
  data: FormData
  onChange: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  errors: FormErrors
}

export function Step3({ data, onChange }: Step3Props) {
  return (
    <div className="space-y-8">
      {/* Intro video */}
      <FieldWrapper
        label="Intro video"
        helper="Your video is how families meet you before they message. 30–90 seconds. Be yourself."
      >
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            Record or upload your intro — 30 to 90 seconds.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This is how families will meet you before they message. Be yourself.
          </p>
          <p className="mt-4 inline-block rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            Video upload coming soon — Mux integration in progress
          </p>
        </div>
      </FieldWrapper>

      {/* Publish toggle */}
      <FieldWrapper
        label="Publish profile"
        helper="You won't appear in search until you go live. Take your time."
      >
        <Toggle
          checked={data.is_published}
          onChange={(v) => onChange('is_published', v)}
          label={data.is_published ? 'Profile is live' : 'Profile is hidden'}
        />
      </FieldWrapper>
    </div>
  )
}
