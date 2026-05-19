import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useMembers } from '../../hooks/useMembers'
import { supabase } from '../../lib/supabase'
import { MemberForm } from '../../components/members/MemberForm'
import { AvatarUpload } from '../../components/members/AvatarUpload'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { FileText, Mail, Loader2 } from 'lucide-react'

export function AccountTab() {
  const { profile, refreshProfile, signOut } = useAuth()
  const { updateMember } = useMembers()

  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)

  // Suppression : étape 1 = demande code, étape 2 = saisie code
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'code'>('idle')
  const [deleteCode, setDeleteCode] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteEmailHint, setDeleteEmailHint] = useState<string | null>(null)

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

      {/* Photo de profil */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-700">🖼️ Photo de profil</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex justify-center">
          <AvatarUpload
            userId={profile.id}
            name={profile.full_name}
            currentUrl={profile.avatar_url}
            onUploaded={async () => { await refreshProfile() }}
          />
        </CardContent>
      </Card>

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
        <CardContent className="pt-4 space-y-3">
          {deleteStep === 'idle' && (
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setDeleteStep('confirm')}>
              Supprimer mon compte
            </Button>
          )}

          {deleteStep === 'confirm' && (
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-medium">⚠️ Action irréversible</p>
              <p className="text-sm text-gray-600">
                Toutes vos données (profil, documents, inscriptions) seront supprimées définitivement.
                Un code de confirmation sera envoyé à <strong>{profile.email}</strong>.
              </p>
              <div className="flex gap-2">
                <Button size="sm" disabled={deleteLoading} className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  onClick={async () => {
                    setDeleteLoading(true); setDeleteError(null)
                    const { data, error } = await supabase.functions.invoke('request-delete-account', {
                      body: { target_user_id: profile.id },
                    })
                    if (error) { setDeleteError(error.message); setDeleteLoading(false); return }
                    setDeleteEmailHint(data?.email ?? null)
                    setDeleteStep('code')
                    setDeleteLoading(false)
                  }}>
                  {deleteLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <><Mail className="h-4 w-4" /> Recevoir le code</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDeleteStep('idle')}>Annuler</Button>
              </div>
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            </div>
          )}

          {deleteStep === 'code' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Un code à 6 chiffres a été envoyé à <strong>{deleteEmailHint ?? profile.email}</strong>.
                Saisissez-le pour confirmer la suppression.
              </p>
              <Input
                className="text-2xl font-mono tracking-widest text-center max-w-[160px]"
                placeholder="000000"
                maxLength={6}
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, ''))}
              />
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
              <div className="flex gap-2">
                <Button size="sm" disabled={deleteLoading || deleteCode.length !== 6}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  onClick={async () => {
                    setDeleteLoading(true); setDeleteError(null)
                    const { error } = await supabase.functions.invoke('confirm-delete-account', {
                      body: { user_id: profile.id, token: deleteCode },
                    })
                    if (error) { setDeleteError('Code invalide ou expiré.'); setDeleteLoading(false); return }
                    // Compte supprimé → déconnexion
                    await signOut()
                  }}>
                  {deleteLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Suppression…</> : 'Supprimer définitivement'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setDeleteStep('idle'); setDeleteCode(''); setDeleteError(null) }}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
