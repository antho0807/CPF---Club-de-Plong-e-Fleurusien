import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, UserX, Phone, Mail, Calendar, FileText, Award, AlertCircle, Waves } from 'lucide-react'
import { AvatarDisplay } from '../components/members/AvatarDisplay'
import { useMember, useMembers } from '../hooks/useMembers'
import { useDocuments } from '../hooks/useDocuments'
import { useAuth } from '../hooks/useAuth'
import { getMemberComplianceStatus, BREVET_LABELS, canUseCaci } from '../lib/compliance'
import { formatDate } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ComplianceBadge } from '../components/members/ComplianceBadge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { MemberForm } from '../components/members/MemberForm'
import { DocumentList } from '../components/documents/DocumentList'
import { DocumentUpload } from '../components/documents/DocumentUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

function DiveHistoryTab({ memberId }: { memberId: string }) {
  const [dives, setDives] = useState<Array<{
    id: string; dive_date: string; site_name: string | null
    event_type: string | null; status: string | null; title: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('event_registrations')
      .select('id, status, events(id, title, date_start, event_type, dive_sites(name))')
      .eq('member_id', memberId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const now = new Date()
        const past = (data ?? [])
          .filter((r) => {
            const ev = r.events as Record<string, unknown> | null
            return ev && new Date(ev.date_start as string) < now
          })
          .map((r) => {
            const ev = r.events as Record<string, unknown>
            const site = (ev.dive_sites as Record<string, unknown> | null)?.name as string | null
            return {
              id: r.id,
              dive_date: (ev.date_start as string).slice(0, 10),
              site_name: site ?? null,
              event_type: ev.event_type as string,
              status: r.status,
              title: ev.title as string,
            }
          })
        setDives(past)
        setLoading(false)
      })
  }, [memberId])

  if (loading) return <div className="text-center py-8 text-gray-400">Chargement…</div>
  if (!dives.length) return <p className="text-sm text-gray-400 text-center py-8">Aucune plongée enregistrée.</p>

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-3">{dives.length} plongée(s) confirmée(s)</p>
      {dives.map((d) => (
        <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white text-sm">
          <div>
            <p className="font-medium text-gray-900">{d.title}</p>
            {d.site_name && <p className="text-xs text-gray-400">{d.site_name}</p>}
          </div>
          <p className="text-xs text-gray-500 flex-shrink-0">{new Date(d.dive_date).toLocaleDateString('fr-BE')}</p>
        </div>
      ))}
    </div>
  )
}

export function MemberProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { member, loading, refetch: refetchMember } = useMember(id)
  const { updateMember, deactivateMember } = useMembers()
  const { documents, refetch: refetchDocs, uploadDocument, deleteDocument } = useDocuments(id)
  const { profile: currentUser, isAdmin, refreshProfile } = useAuth()
  const [showEdit, setShowEdit] = useState(false)

  const isOwnProfile = currentUser?.id === id
  const canEdit = isAdmin || isOwnProfile

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-48" />
        <div className="h-48 bg-gray-200 animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Membre introuvable.</p>
        <Link to="/membres"><Button className="mt-4" variant="outline">Retour</Button></Link>
      </div>
    )
  }

  const { medical, expiryDate, documentType } = getMemberComplianceStatus(documents, member.brevet_level)
  const usesCaci = canUseCaci(member.brevet_level)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link to="/membres">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Membres
          </Button>
        </Link>
        <div className="flex-1" />
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-2">
            <Edit2 className="h-4 w-4" /> Modifier
          </Button>
        )}
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 text-xs ${member.is_ca ? 'text-amber-700 border-amber-300 hover:bg-amber-50' : 'text-gray-600'}`}
            onClick={async () => {
              await updateMember(member.id, { is_ca: !member.is_ca })
              // Rafraîchir le profil en mémoire si c'est le compte courant
              if (isOwnProfile) await refreshProfile()
              await refetchMember()
            }}
          >
            {member.is_ca ? '🏛 Retirer du CA' : '🏛 Ajouter au CA'}
          </Button>
        )}
        {isAdmin && member.is_active && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (confirm('Désactiver ce membre ?')) {
                await deactivateMember(member.id)
                navigate('/membres')
              }
            }}
          >
            <UserX className="h-4 w-4" /> Désactiver
          </Button>
        )}
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <AvatarDisplay avatarUrl={member.avatar_url} name={member.full_name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{member.full_name}</h1>
                {!member.is_active && <Badge variant="secondary">Inactif</Badge>}
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
                {member.is_ca && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">CA</Badge>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {member.phone}
                  </div>
                )}
                {member.date_naissance && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Né(e) le {formatDate(member.date_naissance)}
                  </div>
                )}
                {member.lifras_number && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="h-4 w-4 text-gray-400" />
                    LIFRAS #{member.lifras_number}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {member.brevet_level && (
                <Badge className="text-sm px-3 py-1">
                  {BREVET_LABELS[member.brevet_level]}
                </Badge>
              )}
              <ComplianceBadge status={medical} expiryDate={expiryDate} />
              <p className="text-xs text-gray-500">
                {usesCaci ? 'CACI auto-déclaratif accepté' : 'Attestation médicale requise'}
              </p>
            </div>
          </div>
          {member.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {member.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact d'urgence — visible uniquement par l'intéressé, admins et moniteurs */}
      {(isOwnProfile || isAdmin || currentUser?.role === 'moniteur') && (
        member.emergency_contact_name || member.emergency_contact_phone ? (
          <Card className="border-orange-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" /> Contact d'urgence
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              {member.emergency_contact_name && (
                <p><strong>{member.emergency_contact_name}</strong>{member.emergency_contact_relation ? ` (${member.emergency_contact_relation})` : ''}</p>
              )}
              {member.emergency_contact_phone && (
                <a href={`tel:${member.emergency_contact_phone}`} className="flex items-center gap-2 text-[#0077b6] hover:underline">
                  <Phone className="h-4 w-4" />{member.emergency_contact_phone}
                </a>
              )}
            </CardContent>
          </Card>
        ) : (
          isOwnProfile && (
            <Card className="border-dashed border-orange-200 bg-orange-50/30">
              <CardContent className="p-4 text-sm text-orange-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Aucun contact d'urgence renseigné. Ajoutez-en un dans "Modifier le profil".
              </CardContent>
            </Card>
          )
        )
      )}

      {/* Tabs */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" /> Documents
          </TabsTrigger>
          <TabsTrigger value="plongees" className="gap-2">
            <Waves className="h-4 w-4" /> Plongées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4 mt-4">
          {(canEdit) && (
            <DocumentUpload
              memberId={member.id}
              brevet={member.brevet_level}
              uploadedBy={currentUser?.id ?? ''}
              onUploaded={refetchDocs}
            />
          )}
          <DocumentList
            documents={documents}
            onDelete={canEdit ? deleteDocument : undefined}
          />
        </TabsContent>

        <TabsContent value="plongees" className="mt-4">
          <DiveHistoryTab memberId={member.id} />
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          <MemberForm
            initial={member}
            onSubmit={async (data) => {
              await updateMember(member.id, data)
              await refetchMember()
              // Si c'est son propre profil, rafraîchir le contexte auth aussi
              if (isOwnProfile) await refreshProfile()
              setShowEdit(false)
            }}
            onCancel={() => setShowEdit(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
