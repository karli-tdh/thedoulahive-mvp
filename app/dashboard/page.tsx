import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DoulaDashboard } from './_components/doula-dashboard'
import { FamilyDashboard } from './_components/family-dashboard'

export const metadata = {
  title: 'Dashboard | The Doula Hive',
}

// ── Shared types (re-exported so child components can import them) ─────────────

export interface DashboardConnection {
  id:                       string
  status:                   'pending' | 'accepted' | 'declined'
  reaction_note:            string | null
  initiated_at:             string
  responded_at:             string | null
  last_message_sender_id:   string | null
}

export interface DoulaConnection extends DashboardConnection {
  family_profile_id: string
  due_date:          string | null
  birth_setting:     string | null
  what_they_want:    string | null
  pregnancy_notes:   string | null
  family_video_id:   string | null
  family_name:       string | null
}

export interface FamilyConnection extends DashboardConnection {
  doula_profile_id: string
  doula_tagline:    string | null
  doula_video_id:   string | null
  doula_name:       string | null
  doula_location:   string | null
}

export interface DoulaDashboardData {
  role:               'doula'
  doula_profile_id:   string
  is_published:       boolean
  circle_verified:    boolean
  profile_views_week: number
  first_name:         string
  connections:        DoulaConnection[]
}

export interface FamilyDashboardData {
  role:              'family'
  family_profile_id: string
  connections:       FamilyConnection[]
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { saved?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase.rpc('get_my_connections')

  if (error) {
    console.error('[dashboard] RPC error:', error.message)
  }

  // The RPC returns jsonb — cast to our typed union
  const dash = data as DoulaDashboardData | FamilyDashboardData | { error: string } | null

  if (!dash || 'error' in dash) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Something went wrong loading your dashboard. Please refresh the page.
        </p>
      </main>
    )
  }

  if (dash.role === 'doula') {
    // Fetch circle_verified + first name (not returned by the RPC)
    const [{ data: doulaRow }, { data: profileRow }] = await Promise.all([
      supabase
        .from('doula_profiles')
        .select('circle_verified')
        .eq('id', dash.doula_profile_id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    const firstName = profileRow?.full_name?.trim().split(' ')[0] ?? ''

    // Profile views in the past 7 days
    let profileViewsWeek = 0
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('doula_id', dash.doula_profile_id)
        .gte('created_at', oneWeekAgo)
      profileViewsWeek = count ?? 0
    } catch {
      profileViewsWeek = 0
    }

    return (
      <DoulaDashboard
        data={{
          ...dash,
          circle_verified:    doulaRow?.circle_verified ?? false,
          profile_views_week: profileViewsWeek,
          first_name:         firstName,
        }}
        userId={user.id}
        saved={searchParams.saved === 'true'}
      />
    )
  }

  return <FamilyDashboard data={dash} userId={user.id} />
}
