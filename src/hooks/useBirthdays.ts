import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Birthday {
  day: number
  month: number
  name: string
  userId: string
}

export function useBirthdays(isAdmin: boolean, currentUserId: string | undefined) {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])

  useEffect(() => {
    if (!currentUserId) return
    async function load() {
      let query = supabase
        .from('profiles')
        .select('id, full_name, alias, date_naissance')
        .not('date_naissance', 'is', null)
        .eq('is_active', true)

      if (!isAdmin) query = query.eq('id', currentUserId)

      const { data } = await query
      setBirthdays(
        (data ?? []).map((p) => {
          const d = new Date(p.date_naissance as string)
          const name = (p.alias as string | null) || (p.full_name as string).split(' ')[0]
          return { day: d.getDate(), month: d.getMonth() + 1, name, userId: p.id as string }
        }),
      )
    }
    load()
  }, [isAdmin, currentUserId])

  return birthdays
}
