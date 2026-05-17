import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus, Download, Filter, ChevronRight } from 'lucide-react'
import { AvatarDisplay } from '../components/members/AvatarDisplay'
import { useMembers } from '../hooks/useMembers'
import { useDocuments } from '../hooks/useDocuments'
import { getMemberComplianceStatus, BREVET_LABELS } from '../lib/compliance'
import { exportToCSV, formatDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ComplianceBadge } from '../components/members/ComplianceBadge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { InviteMemberForm } from '../components/members/InviteMemberForm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import type { BrevetLevel, Profile } from '../types/database.types'

function MemberRow({ member }: { member: Profile }) {
  const { documents } = useDocuments(member.id)
  const { medical, expiryDate } = getMemberComplianceStatus(documents, member.brevet_level)

  return (
    <Link to={`/membres/${member.id}`}>
      <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer">
        <AvatarDisplay avatarUrl={member.avatar_url} name={member.full_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900">{member.full_name}</p>
            {!member.is_active && <Badge variant="secondary" className="text-xs">Inactif</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">{member.email}</span>
            {member.lifras_number && (
              <span className="text-xs text-gray-400">LIFRAS #{member.lifras_number}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {member.brevet_level && (
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              {BREVET_LABELS[member.brevet_level]}
            </Badge>
          )}
          <ComplianceBadge status={medical} expiryDate={expiryDate} />
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </Link>
  )
}

export function Members() {
  const { isAdmin } = useAuth()
  const { members, loading, inviteMember } = useMembers()
  const [search, setSearch] = useState('')
  const [filterBrevet, setFilterBrevet] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.lifras_number ?? '').includes(search)
      const matchBrevet = filterBrevet === 'all' || m.brevet_level === filterBrevet
      const matchActive = filterStatus === 'all' || (filterStatus === 'active' ? m.is_active : !m.is_active)
      return matchSearch && matchBrevet && matchActive
    })
  }, [members, search, filterBrevet, filterStatus])

  function handleExport() {
    exportToCSV(
      members.map((m) => ({
        Nom: m.full_name,
        Email: m.email,
        Téléphone: m.phone ?? '',
        'N° LIFRAS': m.lifras_number ?? '',
        Brevet: m.brevet_level ? BREVET_LABELS[m.brevet_level] : '',
        Rôle: m.role,
        Actif: m.is_active ? 'Oui' : 'Non',
        'Inscrit le': formatDate(m.created_at),
      })),
      `membres-cpf-${new Date().toISOString().split('T')[0]}.csv`,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} membres enregistrés</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Rechercher un membre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterBrevet} onValueChange={setFilterBrevet}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Brevet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les brevets</SelectItem>
            {(Object.entries(BREVET_LABELS) as [BrevetLevel, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-50 animate-pulse m-4 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Aucun membre trouvé.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((m) => <MemberRow key={m.id} member={m} />)}
          </div>
        )}
      </Card>

      {/* Invitation d'un nouveau membre */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inviter un nouveau membre</DialogTitle>
          </DialogHeader>
          <InviteMemberForm
            onSubmit={async (data) => {
              const { error } = await inviteMember(data)
              if (error) throw new Error(error)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
