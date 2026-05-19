import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Birthday {
  day: number
  month: number
  name: string
  userId: string
}

// Tous les membres voient tous les anniversaires (esprit club)
export function useBirthdays(currentUserId: string | undefined) {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])

  useEffect(() => {
    if (!currentUserId) return
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, alias, date_naissance')
        .not('date_naissance', 'is', null)
        .eq('is_active', true)
      setBirthdays(
        (data ?? []).flatMap((p) => {
          const raw = (p.date_naissance as string | null)?.slice(0, 10)
          if (!raw) return []
          const parts = raw.split('-')
          const month = parseInt(parts[1], 10)
          const day   = parseInt(parts[2], 10)
          if (!month || !day) return []
          const name = (p.alias as string | null) || (p.full_name as string).split(' ')[0]
          return [{ day, month, name, userId: p.id as string }]
        }),
      )
    }
    load()
  }, [currentUserId])

  return birthdays
}
