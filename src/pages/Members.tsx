import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus, Download, Filter, ChevronRight, Briefcase, UserMinus, UserCheck } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
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
            {member.is_ca && (
              <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">CA</Badge>
            )}
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

function CAManagement() {
  const { members, loading, updateMember } = useMembers()
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  const caMembers = useMemo(() => members.filter((m) => m.is_ca), [members])
  const eligible = useMemo(
    () => members.filter((m) => !m.is_ca && m.is_active &&
      (m.full_name.toLowerCase().includes(search.toLowerCase()) ||
       m.email.toLowerCase().includes(search.toLowerCase()))
    ),
    [members, search],
  )

  async function toggleCA(member: Profile) {
    setToggling(member.id)
    try {
      await updateMember(member.id, { is_ca: !member.is_ca })
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Membres actuels du CA */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-amber-600" />
          Membres du Conseil d'Administration ({caMembers.length})
        </h2>
        {caMembers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
            Aucun membre CA désigné pour l'instant.
          </p>
        ) : (
          <div className="space-y-2">
            {caMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AvatarDisplay avatarUrl={m.avatar_url} name={m.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{m.full_name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">{m.role}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                  disabled={toggling === m.id}
                  onClick={() => toggleCA(m)}
                >
                  <UserMinus className="h-3.5 w-3.5" />
                  {toggling === m.id ? '…' : 'Retirer'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ajouter un membre au CA */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[#0077b6]" />
          Désigner un membre
        </h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {eligible.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {search ? 'Aucun résultat.' : 'Tous les membres actifs font déjà partie du CA.'}
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {eligible.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3">
                <AvatarDisplay avatarUrl={m.avatar_url} name={m.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{m.full_name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                {m.brevet_level && (
                  <span className="text-xs text-gray-400 hidden sm:block">{BREVET_LABELS[m.brevet_level]}</span>
                )}
                <Button
                  size="sm"
                  className="gap-1.5 text-xs shrink-0"
                  disabled={toggling === m.id}
                  onClick={() => toggleCA(m)}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {toggling === m.id ? '…' : 'Ajouter au CA'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
        CA: m.is_ca ? 'Oui' : 'Non',
        Actif: m.is_active ? 'Oui' : 'Non',
        'Inscrit le': formatDate(m.created_at),
      })),
      `membres-cpf-${new Date().toISOString().split('T')[0]}.csv`,
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} membres enregistrés</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
              <UserPlus className="h-4 w-4" /> Inviter
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="liste">
        <TabsList className={isAdmin ? 'w-full' : 'hidden'}>
          <TabsTrigger value="liste" className="flex-1">Tous les membres</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="ca" className="flex-1 gap-2">
              <Briefcase className="h-3.5 w-3.5" /> Conseil d'Administration
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Onglet liste ── */}
        <TabsContent value="liste" className="pt-4 space-y-4">
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
        </TabsContent>

        {/* ── Onglet CA (admin seulement) ── */}
        {isAdmin && (
          <TabsContent value="ca" className="pt-4">
            <CAManagement />
          </TabsContent>
        )}
      </Tabs>

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
