import { FieldWrapper } from './field-wrapper'
import { VideoUploader } from '@/components/video/VideoUploader'
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
        helper="Your video is how families meet you before they message. 30-90 seconds. Be yourself."
      >
        <VideoUploader
          existingPlaybackId={data.intro_video_id || null}
          onVideoReady={(playbackId) => {
            onChange('intro_video_id', playbackId)
            onChange('intro_video_url', `https://stream.mux.com/${playbackId}.m3u8`)
          }}
        />
      </FieldWrapper>

      {/* Go live is managed from the dashboard */}
      <p className="text-sm font-abel text-muted-foreground">
        Once your profile is saved, you can go live from your dashboard using your Circle access code.
      </p>
    </div>
  )
}
