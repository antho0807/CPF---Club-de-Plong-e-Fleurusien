import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getObjectifsForNiveau } from '../data/objectifs'
import type { Exercice } from '../data/objectifs'

interface ProgEntry {
  exercice_id: string
  completed: boolean
  validated_by: string | null
}

export function useMyObjectivesProgress(
  userId: string | undefined,
  brevetLevel: string | null | undefined,
) {
  const [progression, setProgression] = useState<ProgEntry[]>([])
  const [loading, setLoading] = useState(true)

  const objectifs = getObjectifsForNiveau(brevetLevel)

  useEffect(() => {
    if (!userId || !objectifs) { setLoading(false); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase.from('objectifs_progression') as any)
      .select('exercice_id, completed, validated_by')
      .eq('user_id', userId)
      .eq('niveau', objectifs.niveau)
      .then(({ data }: { data: ProgEntry[] | null }) => {
        setProgression(data ?? [])
        setLoading(false)
      })
  }, [userId, objectifs?.niveau])

  const allExercises: Exercice[] = objectifs?.categories.flatMap(c => c.exercices) ?? []
  const doneIds = new Set(
    progression.filter(p => p.completed || !!p.validated_by).map(p => p.exercice_id),
  )
  const total     = allExercises.length
  const completed = doneIds.size
  const pct       = total > 0 ? Math.round(completed / total * 100) : 0
  const remaining = allExercises.filter(e => !doneIds.has(e.id))

  return { objectifs, allExercises, total, completed, pct, remaining, loading }
}
