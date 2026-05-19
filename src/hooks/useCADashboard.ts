import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface CADashboardStats {
  balance: number
  recettes: number
  depenses: number
  caMembers: number
  stockAlerts: number
  nextMeeting: { id: string; title: string; meeting_date: string; location: string | null } | null
  openVotes: number
  recentActions: { action: string; table_name: string; created_at: string; user_id: string | null }[]
}

export function useCADashboard() {
  const [stats, setStats] = useState<CADashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const [
      { data: treasury },
      { data: caProfiles },
      { data: stockAlerts },
      { data: nextMeeting },
      { data: openVotes },
      { data: recentActions },
    ] = await Promise.all([
      supabase.from('ca_treasury').select('amount'),
      supabase.from('profiles').select('id').or('is_ca.eq.true,role.eq.admin').eq('status', 'approved'),
      supabase.from('ca_stock_products')
        .select('id')
        .eq('is_active', true)
        .filter('quantity_current', 'lte', 'quantity_threshold'),
      supabase.from('ca_meetings')
        .select('id, title, meeting_date, location')
        .gte('meeting_date', new Date().toISOString())
        .neq('status', 'cancelled')
        .order('meeting_date')
        .limit(1)
        .maybeSingle(),
      supabase.from('ca_votes').select('id').eq('status', 'open'),
      supabase.from('ca_audit_log')
        .select('action, table_name, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    const amounts = (treasury ?? []).map(t => Number(t.amount))
    const balance = amounts.reduce((s, a) => s + a, 0)
    const recettes = amounts.filter(a => a > 0).reduce((s, a) => s + a, 0)
    const depenses = amounts.filter(a => a < 0).reduce((s, a) => s + a, 0)

    setStats({
      balance,
      recettes,
      depenses,
      caMembers: caProfiles?.length ?? 0,
      stockAlerts: stockAlerts?.length ?? 0,
      nextMeeting: nextMeeting ?? null,
      openVotes: openVotes?.length ?? 0,
      recentActions: (recentActions ?? []) as CADashboardStats['recentActions'],
    })
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { stats, loading, refetch }
}
