import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, UserX, Phone, Mail, Calendar, FileText, Award } from 'lucide-react'
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
            <div className="w-14 h-14 rounded-full bg-[#0077b6] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {member.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{member.full_name}</h1>
                {!member.is_active && <Badge variant="secondary">Inactif</Badge>}
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
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

      {/* Tabs */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" /> Documents
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
