import { createClient } from '@/lib/supabase/server'
import { DolaGrid } from './_components/doula-grid'
import type { DoulaListItem } from './_components/doula-card'

export const metadata = {
  title: 'Find a doula | The Doula Hive',
  description:
    'Browse birth and postpartum doulas. Watch their intro videos and connect directly.',
}

export default async function DoulasPage({
  searchParams,
}: {
  searchParams: { welcome?: string }
}) {
  const supabase = await createClient()

  const { data: doulas, error } = await supabase
    .from('doula_profiles')
    .select(
      `id,
       tagline,
       support_types,
       birth_settings,
       specialisms,
       price_range,
       intro_video_id,
       profiles ( full_name, location )`
    )
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) console.error('[/doulas] fetch error:', error.message)

  // Supabase infers joined rows as arrays without the DB generic;
  // we know profiles is a single object (many-to-one FK), so cast here.
  const typed = (doulas ?? []) as unknown as DoulaListItem[]

  return (
    <main className="min-h-screen">
      <DolaGrid doulas={typed} welcome={searchParams.welcome === 'true'} />
    </main>
  )
}
