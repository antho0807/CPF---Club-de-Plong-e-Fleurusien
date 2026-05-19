import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { PWAGuide } from '../components/pwa/PWAGuide'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function InstallApp() {
  const navigate = useNavigate()
  const { isStandalone, confirmInstalled } = usePWAInstall()

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-bold text-gray-900">App déjà installée !</h1>
        <p className="text-sm text-gray-500">Tu utilises déjà l'app CPF depuis ton écran d'accueil.</p>
        <button onClick={() => navigate('/')} className="text-sm text-[#0077b6] font-medium hover:underline mt-2">
          Aller au tableau de bord
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0077b6] text-white px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="font-bold text-sm">CPF Plongée</p>
          <p className="text-xs text-blue-200">Installer l'application</p>
        </div>
      </header>

      {/* Guide */}
      <div className="flex-1 overflow-y-auto p-4">
        <PWAGuide
          standalone
          onConfirm={() => { confirmInstalled(); navigate('/') }}
          onRemindLater={() => navigate(-1)}
          onClose={() => navigate(-1)}
        />
      </div>
    </div>
  )
}
