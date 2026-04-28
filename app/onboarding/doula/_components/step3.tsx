import { FieldWrapper } from './field-wrapper'
import { Toggle } from './toggle'
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
        helper="Your video is how families meet you before they message. 30–90 seconds. Be yourself."
      >
        <VideoUploader
          existingPlaybackId={data.intro_video_id || null}
          onVideoReady={(playbackId) => {
            onChange('intro_video_id', playbackId)
            onChange('intro_video_url', `https://stream.mux.com/${playbackId}.m3u8`)
          }}
        />
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
