import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'

export function AccountTab() {
  const { profile, refreshProfile, signOut } = useAuth()

  const [alias, setAlias] = useState(profile?.alias ?? '')
  const [aliasLoading, setAliasLoading] = useState(false)
  const [aliasMsg, setAliasMsg] = useState<string | null>(null)

  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleAlias() {
    if (!profile) return
    setAliasLoading(true); setAliasMsg(null)
    const { error } = await supabase.from('profiles').update({ alias: alias.trim() || null }).eq('id', profile.id)
    if (error) { setAliasMsg('Erreur : ' + error.message) }
    else { await refreshProfile(); setAliasMsg('Pseudo mis à jour.') }
    setAliasLoading(false)
  }

  async function handleEmail() {
    if (!newEmail.trim()) return
    setEmailLoading(true); setEmailMsg(null)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) { setEmailMsg('Erreur : ' + error.message) }
    else { setEmailMsg('Un email de confirmation a été envoyé à ' + newEmail + '.') }
    setEmailLoading(false)
  }

  async function handlePassword() {
    if (!newPwd || newPwd.length < 8) { setPwdMsg('Le mot de passe doit faire au moins 8 caractères.'); return }
    setPwdLoading(true); setPwdMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { setPwdMsg('Erreur : ' + error.message) }
    else { setPwdMsg('Mot de passe mis à jour.'); setCurrentPwd(''); setNewPwd('') }
    setPwdLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Alias */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Pseudo / Alias</h2>
        <div className="space-y-3">
          <div>
            <Label>Votre pseudo affiché dans l'app</Label>
            <Input className="mt-1" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder={profile?.full_name} />
            <p className="text-xs text-gray-400 mt-1">Laissez vide pour afficher votre nom complet.</p>
          </div>
          {aliasMsg && <p className={`text-sm ${aliasMsg.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{aliasMsg}</p>}
          <Button size="sm" onClick={handleAlias} disabled={aliasLoading}>
            {aliasLoading ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* Email */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Adresse email</h2>
        <p className="text-xs text-gray-400 mb-4">Email actuel : <strong>{profile?.email}</strong></p>
        <div className="space-y-3">
          <div>
            <Label>Nouvel email</Label>
            <Input className="mt-1" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nouveau@email.com" />
          </div>
          {emailMsg && <p className={`text-sm ${emailMsg.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{emailMsg}</p>}
          <Button size="sm" onClick={handleEmail} disabled={emailLoading || !newEmail.trim()}>
            {emailLoading ? 'Envoi…' : 'Changer l\'email'}
          </Button>
        </div>
      </div>

      {/* Mot de passe */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Mot de passe</h2>
        <div className="space-y-3">
          <div>
            <Label>Nouveau mot de passe</Label>
            <Input className="mt-1" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="8 caractères minimum" />
          </div>
          {pwdMsg && <p className={`text-sm ${pwdMsg.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{pwdMsg}</p>}
          <Button size="sm" onClick={handlePassword} disabled={pwdLoading || !newPwd}>
            {pwdLoading ? 'Mise à jour…' : 'Changer le mot de passe'}
          </Button>
        </div>
      </div>

      {/* Supprimer le compte */}
      <div className="bg-red-50 rounded-xl border border-red-100 p-5">
        <h2 className="text-sm font-semibold text-red-700 mb-2">Zone de danger</h2>
        {!confirmDelete ? (
          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
            Supprimer mon compte
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700">Êtes-vous sûr ? Cette action est irréversible et supprimera toutes vos données.</p>
            <div className="flex gap-3">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={signOut}>
                Confirmer et se déconnecter
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Annuler</Button>
            </div>
            <p className="text-xs text-red-400">Contactez l'administrateur pour supprimer définitivement votre compte.</p>
          </div>
        )}
      </div>
    </div>
  )
}
