import { useEffect, useState } from 'react'
import { Users, AlertTriangle, XCircle, Waves } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { supabase } from '../../lib/supabase'
import { getMemberComplianceStatus } from '../../lib/compliance'
import type { MemberDocument, Profile } from '../../types/database.types'

interface Stats {
  totalActifs: number
  expires: number
  expirantBientot: number
  prochainsSorties: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({ totalActifs: 0, expires: 0, expirantBientot: 0, prochainsSorties: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: members }, { data: docs }, { data: events }] = await Promise.all([
        supabase.from('profiles').select('id,brevet_level,is_active').eq('is_active', true),
        supabase.from('member_documents').select('*').in('type', ['certificat_medical', 'caci']),
        supabase
          .from('events')
          .select('id')
          .gte('date_start', new Date().toISOString())
          .lte('date_start', new Date(Date.now() + 30 * 86400000).toISOString())
          .eq('is_cancelled', false),
      ])

      const memberList = (members ?? []) as Profile[]
      const docList = (docs ?? []) as MemberDocument[]

      let expires = 0
      let expirantBientot = 0

      for (const m of memberList) {
        const memberDocs = docList.filter((d) => d.member_id === m.id)
        const { medical } = getMemberComplianceStatus(memberDocs, m.brevet_level)
        if (medical === 'expired' || medical === 'missing') expires++
        else if (medical === 'expiring_soon') expirantBientot++
      }

      setStats({
        totalActifs: memberList.length,
        expires,
        expirantBientot,
        prochainsSorties: events?.length ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    {
      label: 'Membres actifs',
      value: stats.totalActifs,
      sub: 'plongeurs inscrits',
      icon: Users,
      color: 'text-[#0077b6]',
      bg: 'bg-blue-50',
    },
    {
      label: 'Sorties (30 jours)',
      value: stats.prochainsSorties,
      sub: 'événements à venir',
      icon: Waves,
      color: 'text-[#2a9d8f]',
      bg: 'bg-teal-50',
    },
    {
      label: 'Expire bientôt',
      value: stats.expirantBientot,
      sub: 'certificats médicaux',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Non conformes',
      value: stats.expires,
      sub: 'certificats expirés',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-3xl font-extrabold leading-none ${color}`}>
                  {loading ? '—' : value}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1 leading-tight">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
