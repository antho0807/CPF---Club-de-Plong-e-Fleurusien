import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'

// Notifie les admins une seule fois à la première visite de cette page
async function notifyAdminsOnce(profileId: string, fullName: string) {
  const key = `admin_notified_${profileId}`
  if (localStorage.getItem(key)) return
  await supabase.functions.invoke('notify-admins-new-member', {
    body: { member_id: profileId, member_name: fullName },
  }).catch(console.error)
  localStorage.setItem(key, 'true')
}

type StatusResult = 'pending' | 'approved' | 'rejected' | 'error' | null

export function PendingApproval() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<StatusResult>(null)

  // Notifier les admins dès l'arrivée sur cette page (une seule fois)
  useEffect(() => {
    if (profile?.id && profile?.full_name) {
      notifyAdminsOnce(profile.id, profile.full_name)
    }
  }, [profile?.id, profile?.full_name])

  const handleVerify = useCallback(async () => {
    if (!profile?.id || checking) return
    setChecking(true)
    setResult(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', profile.id)
        .single()

      if (error) { setResult('error'); return }

      if (data.status === 'approved') {
        setResult('approved')
        setTimeout(() => navigate('/'), 1000)
      } else if (data.status === 'rejected') {
        setResult('rejected')
      } else {
        setResult('pending')
      }
    } catch {
      setResult('error')
    } finally {
      setChecking(false)
    }
  }, [profile?.id, checking, navigate])

  // Vérification automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(handleVerify, 30_000)
    return () => clearInterval(interval)
  }, [handleVerify])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0077b6] to-[#023e8a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-cpf.png" alt="CPF" className="w-24 h-24 object-contain mx-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white">CPF Plongée</h1>
          <p className="text-blue-200 text-sm mt-1">Club de Plongée Fleurusien · LIFRAS/CMAS</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 rounded-full mb-4">
            <Clock className="h-7 w-7 text-amber-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Compte en attente de validation
          </h2>

          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            Bonjour <span className="font-medium">{profile?.full_name}</span>,
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Votre inscription a bien été reçue. Un administrateur du CPF doit valider
            votre compte avant que vous puissiez accéder à l'application.
            Vous serez contacté par email dès l'approbation.
          </p>

          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 mb-4">
            En attendant, vous pouvez contacter le club directement si votre demande est urgente.
          </div>

          {/* Résultat de la vérification */}
          {result === 'pending' && (
            <div className="flex items-center gap-2 justify-center mb-4 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-2.5 border border-amber-100">
              <Clock className="h-4 w-4 flex-shrink-0" />
              Votre demande est toujours en attente de validation.
            </div>
          )}
          {result === 'approved' && (
            <div className="flex items-center gap-2 justify-center mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2.5 border border-green-100">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Compte approuvé ! Redirection en cours…
            </div>
          )}
          {result === 'rejected' && (
            <div className="flex items-center gap-2 justify-center mb-4 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-2.5 border border-red-100">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              Votre demande a été refusée. Contactez le club.
            </div>
          )}
          {result === 'error' && (
            <div className="flex items-center gap-2 justify-center mb-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Impossible de vérifier. Réessayez dans un instant.
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleVerify}
            disabled={checking}
            className="w-full mb-3 gap-2"
          >
            {checking
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Vérification…</>
              : <><RefreshCw className="h-4 w-4" /> Vérifier mon statut</>
            }
          </Button>
          <Button variant="ghost" onClick={signOut} className="w-full text-gray-400 hover:text-gray-600">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
