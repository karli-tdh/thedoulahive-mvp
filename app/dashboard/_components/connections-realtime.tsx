'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Invisible component — subscribes to Postgres changes on the connections
 * table filtered to this user's profile, then calls router.refresh() so
 * the server component re-fetches fresh data without a full page reload.
 */
interface Props {
  /** 'doula_id' for doulas, 'family_id' for families */
  profileField: 'doula_id' | 'family_id'
  profileId: string
}

export function ConnectionsRealtime({ profileField, profileId }: Props) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`connections:${profileField}=${profileId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'connections',
          filter: `${profileField}=eq.${profileId}`,
        },
        () => router.refresh()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profileField, profileId, router])

  return null
}
