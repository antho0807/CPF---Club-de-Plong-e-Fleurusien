import { Anchor, XCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'

export function Rejected() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0077b6] to-[#023e8a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Anchor className="h-8 w-8 text-[#0077b6]" />
          </div>
          <h1 className="text-2xl font-bold text-white">CPF Plongée</h1>
          <p className="text-blue-200 text-sm mt-1">Club de Plongée Fleurusien · LIFRAS/CMAS</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès refusé
          </h2>

          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            Bonjour <span className="font-medium">{profile?.full_name}</span>,
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Votre demande d'accès à l'application CPF n'a pas pu être accordée.
            Pour toute question, contactez directement un administrateur du club.
          </p>

          <Button variant="outline" onClick={signOut} className="w-full">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  )
}
