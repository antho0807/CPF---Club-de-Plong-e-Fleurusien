import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { useDocuments } from '../hooks/useDocuments'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ComplianceBadge } from '../components/members/ComplianceBadge'
import { DocumentUpload } from '../components/documents/DocumentUpload'
import { DocumentList } from '../components/documents/DocumentList'
import { MemberForm } from '../components/members/MemberForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { getMemberComplianceStatus, BREVET_LABELS } from '../lib/compliance'
import { formatDate } from '../lib/utils'
import { Edit2, LogOut, User, Mail, Phone, Calendar, Award } from 'lucide-react'

export function Profile() {
  const { profile, signOut, refreshProfile, isAdmin } = useAuth()
  const { updateMember } = useMembers()
  const { documents, refetch, uploadDocument, deleteDocument } = useDocuments(profile?.id)
  const [showEdit, setShowEdit] = useState(false)

  if (!profile) return null

  const { medical, expiryDate } = getMemberComplianceStatus(documents, profile.brevet_level)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-2">
            <Edit2 className="h-4 w-4" /> Modifier
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0077b6] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
                <ComplianceBadge status={medical} expiryDate={expiryDate} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />{profile.email}
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />{profile.phone}
                  </div>
                )}
                {profile.date_naissance && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(profile.date_naissance)}
                  </div>
                )}
                {profile.lifras_number && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award className="h-4 w-4 text-gray-400" />
                    LIFRAS #{profile.lifras_number}
                  </div>
                )}
                {profile.brevet_level && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    {BREVET_LABELS[profile.brevet_level]}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentUpload
        memberId={profile.id}
        brevet={profile.brevet_level}
        uploadedBy={profile.id}
        onUploaded={refetch}
      />

      <DocumentList documents={documents} onDelete={deleteDocument} />

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Modifier mon profil</DialogTitle></DialogHeader>
          <MemberForm
            initial={profile}
            isAdmin={isAdmin}
            onSubmit={async (data) => {
              await updateMember(profile.id, data)
              await refreshProfile()
              setShowEdit(false)
            }}
            onCancel={() => setShowEdit(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
