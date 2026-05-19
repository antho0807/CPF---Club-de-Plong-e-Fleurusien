import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useMembers } from '../../hooks/useMembers'
import { supabase } from '../../lib/supabase'
import { MemberForm } from '../../components/members/MemberForm'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { FileText } from 'lucide-react'

export function AccountTab() {
  const { profile, refreshProfile, signOut } = useAuth()
  const { updateMember } = useMembers()

  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleEmailChange() {
    if (!newEmail.trim()) return
    setEmailLoading(true); setEmailMsg(null)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) { setEmailMsg('Erreur : ' + error.message) }
    else { setEmailMsg('Un email de confirmation a été envoyé à ' + newEmail) }
    setEmailLoading(false)
  }

  if (!profile) return null

  return (
    <div className="space-y-6">

      {/* Formulaire profil complet */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-700">👤 Mon profil</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <MemberForm
            initial={profile}
            isAdmin={false}
            onSubmit={async (data) => {
              await updateMember(profile.id, data)
              await refreshProfile()
            }}
            onCancel={() => {}}
          />
        </CardContent>
      </Card>

      {/* Lien vers documents / conformité */}
      <Link to="/profil">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer">
          <FileText className="h-5 w-5 text-[#0077b6] flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#0077b6]">Mes documents & conformité</p>
            <p className="text-xs text-blue-500">Certificat médical, carte LIFRAS, avatar…</p>
          </div>
        </div>
      </Link>

      {/* Changer l'email */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-700">✉️ Changer d'adresse email</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-gray-400">Email actuel : <strong>{profile.email}</strong></p>
          <div>
            <Label>Nouvel email</Label>
            <Input className="mt-1" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nouveau@email.com" />
          </div>
          {emailMsg && <p className={`text-sm ${emailMsg.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{emailMsg}</p>}
          <Button size="sm" onClick={handleEmailChange} disabled={emailLoading || !newEmail.trim()}>
            {emailLoading ? 'Envoi…' : 'Changer l\'email'}
          </Button>
        </CardContent>
      </Card>

      {/* Zone danger */}
      <Card className="border-red-100 bg-red-50">
        <CardHeader className="pb-3 border-b border-red-100">
          <CardTitle className="text-sm font-semibold text-red-700">⚠️ Zone de danger</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {!confirmDelete ? (
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
              Supprimer mon compte
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700">Cette action est irréversible et supprimera toutes vos données.</p>
              <div className="flex gap-3">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={signOut}>Confirmer</Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Annuler</Button>
              </div>
              <p className="text-xs text-red-400">Contactez l'administrateur pour supprimer définitivement votre compte.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
