import { useEffect } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'

export function PendingApproval() {
  const { profile, signOut, refreshProfile } = useAuth()

  // Vérifie automatiquement le statut toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => refreshProfile(), 30_000)
    return () => clearInterval(interval)
  }, [refreshProfile])

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

          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 mb-6">
            En attendant, vous pouvez contacter le club directement si votre demande est urgente.
          </div>

          <Button variant="outline" onClick={refreshProfile} className="w-full mb-3 gap-2">
            <RefreshCw className="h-4 w-4" /> Vérifier mon statut
          </Button>
          <Button variant="ghost" onClick={signOut} className="w-full text-gray-400 hover:text-gray-600">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
