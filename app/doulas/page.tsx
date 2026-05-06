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

  const [{ data: doulas, error }, { count: liveRaw }] = await Promise.all([
    supabase
      .from('doula_profiles')
      .select(
        `id,
         tagline,
         support_types,
         birth_settings,
         specialisms,
         languages,
         price_range,
         intro_video_id,
         circle_verified,
         profiles ( full_name, location )`
      )
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('doula_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_live', true),
  ])

  if (error) console.error('[/doulas] fetch error:', error.message)

  // Supabase infers joined rows as arrays without the DB generic;
  // we know profiles is a single object (many-to-one FK), so cast here.
  const typed     = (doulas ?? []) as unknown as DoulaListItem[]
  const liveCount = liveRaw ?? typed.length  // fall back to published count
  const languages = Array.from(new Set(typed.flatMap((d) => d.languages ?? []))).sort()

  return (
    <main className="min-h-screen">
      <DolaGrid doulas={typed} languages={languages} liveCount={liveCount} welcome={searchParams.welcome === 'true'} />
    </main>
  )
}
