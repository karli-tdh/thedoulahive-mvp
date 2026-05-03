import { redirect } from 'next/navigation'
import Link from 'next/link'
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

// ── Error page ────────────────────────────────────────────────────────────────

function ThreadError({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-foreground">Could not load conversation</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {message}
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
      >
        Back to dashboard
      </Link>
    </main>
  )
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

  console.log('[conversation] loading thread for connection:', params.connection_id)

  const { data, error } = await supabase.rpc('get_conversation_thread', {
    p_connection_id: params.connection_id,
  })

  if (error) {
    console.error('[conversation] RPC error:', error.message, error.details, error.hint)
    return <ThreadError message={`Database error: ${error.message}`} />
  }

  const thread = data as ThreadData | { error: string } | null

  if (!thread) {
    console.error('[conversation] RPC returned null for connection:', params.connection_id)
    return <ThreadError message="No data returned. Check that migration 009 has been run." />
  }

  if ('error' in thread) {
    console.error('[conversation] thread error:', thread.error, 'connection:', params.connection_id)
    return <ThreadError message={thread.error} />
  }

  return (
    <ConversationThread
      initialData={thread}
      currentUserId={user.id}
      connectionId={params.connection_id}
    />
  )
}
