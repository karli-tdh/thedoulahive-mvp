import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConversationThread } from './_components/conversation-thread'

// ── Types (exported for the client component) ─────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ConversationPage({
  params,
}: {
  params: { connection_id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase.rpc('get_conversation_thread', {
    p_connection_id: params.connection_id,
  })

  if (error) {
    console.error('[conversation] RPC error:', error.message)
    redirect('/dashboard')
  }

  const thread = data as ThreadData | { error: string } | null

  if (!thread || 'error' in thread) {
    redirect('/dashboard')
  }

  return (
    <ConversationThread
      initialData={thread}
      currentUserId={user.id}
      connectionId={params.connection_id}
    />
  )
}
