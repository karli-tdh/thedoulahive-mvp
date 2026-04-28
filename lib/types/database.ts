// ============================================================
// The Doula Hive — Database Types
// Hand-authored to match supabase/migrations/001_initial_schema.sql
// ============================================================

export type Role = 'doula' | 'family'
export type ConnectionStatus = 'pending' | 'accepted' | 'declined'
export type MessageType = 'video' | 'text'

// ------------------------------------------------------------
// Table row types (what you get back from Supabase selects)
// ------------------------------------------------------------

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  email: string | null
  avatar_url: string | null
  location: string | null
  created_at: string
}

export interface DoulaProfile {
  id: string
  user_id: string
  tagline: string | null
  bio: string | null
  intro_video_url: string | null
  intro_video_id: string | null
  years_experience: number | null
  training_body: string | null
  languages: string[] | null
  specialisms: string[] | null
  support_types: string[] | null
  birth_settings: string[] | null
  travel_radius_km: number | null
  price_range: string | null
  availability: string | null
  is_published: boolean
  created_at: string
}

export interface FamilyProfile {
  id: string
  user_id: string
  due_date: string | null
  birth_setting: string | null
  pregnancy_notes: string | null
  intro_video_url: string | null
  intro_video_id: string | null
  what_they_want: string | null
  created_at: string
}

export interface Connection {
  id: string
  family_id: string
  doula_id: string
  status: ConnectionStatus
  reaction_note: string | null
  initiated_at: string
  responded_at: string | null
}

export interface Message {
  id: string
  connection_id: string
  sender_id: string
  message_type: MessageType
  video_url: string | null
  video_id: string | null
  body: string | null
  created_at: string
}

// ------------------------------------------------------------
// Insert types (what you pass in to create a new row)
// ------------------------------------------------------------

export type ProfileInsert = Omit<Profile, 'created_at'> & {
  created_at?: string
}

export type DoulaProfileInsert = Omit<DoulaProfile, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type FamilyProfileInsert = Omit<FamilyProfile, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type ConnectionInsert = Omit<
  Connection,
  'id' | 'status' | 'initiated_at' | 'responded_at'
> & {
  id?: string
  status?: ConnectionStatus
  initiated_at?: string
  responded_at?: string | null
}

export type MessageInsert = Omit<Message, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

// ------------------------------------------------------------
// Update types (all fields optional except the primary key)
// ------------------------------------------------------------

export type ProfileUpdate = Partial<Omit<Profile, 'id'>>
export type DoulaProfileUpdate = Partial<Omit<DoulaProfile, 'id'>>
export type FamilyProfileUpdate = Partial<Omit<FamilyProfile, 'id'>>
export type ConnectionUpdate = Partial<Omit<Connection, 'id'>>
export type MessageUpdate = Partial<Omit<Message, 'id'>>

// ------------------------------------------------------------
// Joined / enriched types (for UI convenience)
// ------------------------------------------------------------

/** A doula profile with its base profile data joined in */
export interface DoulaWithProfile extends DoulaProfile {
  profile: Profile
}

/** A family profile with its base profile data joined in */
export interface FamilyWithProfile extends FamilyProfile {
  profile: Profile
}

/** A connection with both sides fully expanded */
export interface ConnectionWithParties extends Connection {
  doula: DoulaWithProfile
  family: FamilyWithProfile
}

/** A message with the sender's profile attached */
export interface MessageWithSender extends Message {
  sender: Profile
}

// ------------------------------------------------------------
// Supabase Database shape (for createClient generics)
// ------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      doula_profiles: {
        Row: DoulaProfile
        Insert: DoulaProfileInsert
        Update: DoulaProfileUpdate
      }
      family_profiles: {
        Row: FamilyProfile
        Insert: FamilyProfileInsert
        Update: FamilyProfileUpdate
      }
      connections: {
        Row: Connection
        Insert: ConnectionInsert
        Update: ConnectionUpdate
      }
      messages: {
        Row: Message
        Insert: MessageInsert
        Update: MessageUpdate
      }
    }
  }
}
