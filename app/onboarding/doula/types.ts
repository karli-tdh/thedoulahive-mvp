export interface FormData {
  // Step 1 — profiles table
  full_name: string
  location: string
  // Step 1 — doula_profiles table
  tagline: string
  bio: string
  // Step 2 — doula_profiles table
  clients_supported: string
  training_body: string[]
  languages: string[]
  specialisms: string[]
  support_types: string[]
  birth_settings: string[]
  travel_radius_km: string
  price_range: string
  availability: string
  // Step 3 — doula_profiles table
  intro_video_url: string
  intro_video_id: string
  is_published: boolean
}

export type FormErrors = Partial<Record<keyof FormData, string>>

export const INITIAL_FORM_DATA: FormData = {
  full_name: '',
  location: '',
  tagline: '',
  bio: '',
  clients_supported: '',
  training_body: [],
  languages: [],
  specialisms: [],
  support_types: [],
  birth_settings: [],
  travel_radius_km: '',
  price_range: '',
  availability: '',
  intro_video_url: '',
  intro_video_id: '',
  is_published: false,
}
