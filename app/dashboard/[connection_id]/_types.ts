// Shared types for the conversation thread page and its client components.
// Kept in a separate file because Next.js App Router does not allow
// client components to import directly from page.tsx.

export interface ThreadMessage {
  id:           string
  sender_id:    string
  sender_name:  string | null
  message_type: 'video' | 'text' | 'contact_share'
  video_id:     string | null
  video_url:    string | null
  body:         string | null
  created_at:   string
  is_mine:      boolean
}

export interface ThreadData {
  role:              'doula' | 'family'
  other_name:        string | null
  other_location:    string | null
  current_user_name: string | null
  connection_id:     string
  messages:          ThreadMessage[]
  doula_contact: {
    phone:   string | null
    email:   string | null
    website: string | null
  } | null
}
