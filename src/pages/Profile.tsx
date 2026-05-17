import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { useDocuments } from '../hooks/useDocuments'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ComplianceBadge } from '../components/members/ComplianceBadge'
import { DocumentUpload } from '../components/documents/DocumentUpload'
import { DocumentList } from '../components/documents/DocumentList'
import { MemberForm } from '../components/members/MemberForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { getMemberComplianceStatus, BREVET_LABELS } from '../lib/compliance'
import { formatDate } from '../lib/utils'
import { Edit2, LogOut, User, Mail, Phone, Calendar, Award, Lock, Loader2, CheckCircle, Bell, BellOff, AlertCircle } from 'lucide-react'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { AvatarUpload } from '../components/members/AvatarUpload'

const pwSchema = z.object({
  newPassword: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})
type PwForm = z.infer<typeof pwSchema>

function PasswordSection() {
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  async function onSubmit(data: PwForm) {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (!error) {
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-500" /> Sécurité
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm mb-4">
            <CheckCircle className="h-4 w-4" /> Mot de passe mis à jour avec succès.
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label>Nouveau mot de passe</Label>
            <Input type="password" className="mt-1" placeholder="Minimum 8 caractères" {...register('newPassword')} />
            {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <Label>Confirmer le nouveau mot de passe</Label>
            <Input type="password" className="mt-1" placeholder="••••••••" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour…</> : 'Changer le mot de passe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PushSection({ userId }: { userId: string }) {
  const { supported, subscribed, loading, toggle } = usePushNotifications(userId)

  if (!supported) return null

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {subscribed ? <Bell className="h-5 w-5 text-[#0077b6]" /> : <BellOff className="h-5 w-5 text-gray-400" />}
          <div>
            <p className="font-semibold text-sm text-gray-900">Notifications push</p>
            <p className="text-xs text-gray-500">
              {subscribed ? 'Activées — vous recevez les alertes du club' : 'Désactivées'}
            </p>
          </div>
        </div>
        <Button size="sm" variant={subscribed ? 'outline' : 'default'} onClick={toggle} disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : subscribed ? 'Désactiver' : 'Activer'}
        </Button>
      </CardContent>
    </Card>
  )
}

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
            <AvatarUpload
              userId={profile.id}
              name={profile.full_name}
              currentUrl={profile.avatar_url}
              onUploaded={() => refreshProfile()}
            />
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

      {/* Contacts d'urgence */}
      {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
        <Card className="border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" /> Contact d'urgence
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-1">
            {profile.emergency_contact_name && <p><strong>{profile.emergency_contact_name}</strong>{profile.emergency_contact_relation ? ` (${profile.emergency_contact_relation})` : ''}</p>}
            {profile.emergency_contact_phone && (
              <a href={`tel:${profile.emergency_contact_phone}`} className="flex items-center gap-2 text-[#0077b6] hover:underline">
                <Phone className="h-4 w-4" />{profile.emergency_contact_phone}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      <PushSection userId={profile.id} />

      <PasswordSection />

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
