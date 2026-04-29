import { Textarea } from '@/components/ui/textarea'
import { VideoUploader } from '@/components/video/VideoUploader'
import type { FormData, FormErrors } from '../types'

interface Step2Props {
  data:     FormData
  errors:   FormErrors
  onChange: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  onSkipVideo: () => void
}

function Field({
  label,
  helper,
  error,
  children,
  labelNode,
}: {
  label?:    string
  labelNode?: React.ReactNode
  helper?:   string
  error?:    string
  children:  React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {labelNode ?? (
        label && (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )
      )}
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

// Small inline lock icon
function LockIcon() {
  return (
    <svg
      className="inline-block h-3.5 w-3.5 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  )
}

export function Step2({ data, errors, onChange, onSkipVideo }: Step2Props) {
  return (
    <div className="space-y-8">

      {/* Intro message */}
      <p className="rounded-xl bg-muted/50 px-5 py-4 text-sm text-foreground/80">
        Almost there. These are optional — but they help doulas show up for you in the right way.
      </p>

      {/* Pregnancy notes — private */}
      <Field
        labelNode={
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            Pregnancy background
            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
              · <LockIcon /> Private
            </span>
          </p>
        }
        helper="Only shared with doulas you connect with — never public. Share only what feels comfortable."
        error={errors.pregnancy_notes}
      >
        <Textarea
          value={data.pregnancy_notes}
          onChange={(e) => onChange('pregnancy_notes', e.target.value)}
          placeholder="Anything you'd want a doula to know — past births, what you're hoping for, what you're worried about."
          rows={4}
        />
      </Field>

      {/* Intro video */}
      <Field
        label="Intro video (optional)"
        helper="Optional — but it can make it easier for a doula to say yes. Think: a warm hello, what you're hoping for, and what kind of support feels right."
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground/80">
            Record or upload a short hello — 30 to 60 seconds.
          </p>
          <VideoUploader
            existingPlaybackId={data.intro_video_id || null}
            onVideoReady={(playbackId) => {
              onChange('intro_video_id',  playbackId)
              onChange('intro_video_url', `https://stream.mux.com/${playbackId}.m3u8`)
            }}
          />
          <button
            type="button"
            onClick={onSkipVideo}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Skip for now
          </button>
        </div>
      </Field>

    </div>
  )
}
