export interface FormData {
  due_date:        string   // YYYY-MM-DD
  birth_setting:   string
  what_they_want:  string
  pregnancy_notes: string
  intro_video_url: string
  intro_video_id:  string
}

export type FormErrors = Partial<Record<keyof FormData, string>>

export const INITIAL_FORM_DATA: FormData = {
  due_date:        '',
  birth_setting:   '',
  what_they_want:  '',
  pregnancy_notes: '',
  intro_video_url: '',
  intro_video_id:  '',
}

export const BIRTH_SETTINGS = [
  'Home',
  'Midwife-led unit (MLU)',
  'Hospital',
  'Not sure yet',
] as const
