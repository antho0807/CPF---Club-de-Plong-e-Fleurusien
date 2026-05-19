import { X, CheckCircle, Clock, Copy, Check } from 'lucide-react'
import { useState, useRef } from 'react'
import { detectOS } from '../../hooks/usePWAInstall'
import { Button } from '../ui/button'

interface Props {
  onConfirm: () => void
  onRemindLater: () => void
  onClose: () => void
  standalone?: boolean // true = page standalone /installer-app
}

// ── Illustrations SVG simples ────────────────────────────────

function IOSShareIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#007AFF" fillOpacity=".1"/>
      <path d="M24 8v20M17 15l7-7 7 7" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 26v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function IOSAddHomeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#007AFF" fillOpacity=".1"/>
      <rect x="10" y="14" width="28" height="20" rx="4" stroke="#007AFF" strokeWidth="2"/>
      <path d="M20 24h8M24 20v8" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function AndroidMenuIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4CAF50" fillOpacity=".1"/>
      <circle cx="24" cy="16" r="2.5" fill="#4CAF50"/>
      <circle cx="24" cy="24" r="2.5" fill="#4CAF50"/>
      <circle cx="24" cy="32" r="2.5" fill="#4CAF50"/>
    </svg>
  )
}

function AndroidAddIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4CAF50" fillOpacity=".1"/>
      <rect x="10" y="14" width="28" height="20" rx="4" stroke="#4CAF50" strokeWidth="2"/>
      <path d="M20 24h8M24 20v8" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

// ── Contenu du guide selon l'OS ──────────────────────────────

function Step({ n, icon, title, note }: { n: number; icon: React.ReactNode; title: React.ReactNode; note?: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className="w-7 h-7 rounded-full bg-[#0077b6] text-white text-xs font-bold flex items-center justify-center">{n}</div>
        <div>{icon}</div>
      </div>
      <div className="flex-1 pt-1.5">
        <p className="text-sm font-medium text-gray-800 leading-snug">{title}</p>
        {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
      </div>
    </div>
  )
}

function iOSGuide(isSafari: boolean) {
  const [copied, setCopied] = useState(false)
  async function copyLink() {
    await navigator.clipboard.writeText(window.location.origin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {!isSafari && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Ouvre cette page dans Safari</p>
            <p className="text-xs text-amber-700 mt-0.5">L'installation sur iPhone nécessite Safari.</p>
            <button onClick={copyLink} className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mt-2 hover:text-amber-900">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Lien copié !' : 'Copier le lien'}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <Step n={1} icon={<IOSShareIcon />} title={<>Appuie sur l'icône <strong>Partager ↑</strong> en bas de Safari</>} />
        <Step n={2} icon={<IOSAddHomeIcon />} title={<>Fais défiler et appuie sur <strong>"Sur l'écran d'accueil"</strong></>} />
        <Step n={3} icon={<div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl font-bold text-[#007AFF]">+</div>} title={<>Appuie sur <strong>"Ajouter"</strong> en haut à droite</>} />
        <Step n={4} icon={<div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>} title={<>L'app <strong>CPF</strong> apparaît sur ton écran d'accueil !</>} />
      </div>
      <p className="text-[11px] text-gray-400 leading-snug">Les notifications push nécessitent iOS 16.4 minimum. Pour vérifier : <em>Réglages → Général → Informations</em>.</p>
    </div>
  )
}

function androidGuide(isSamsung: boolean, isChrome: boolean) {
  if (isSamsung) {
    return (
      <div className="space-y-4">
        <Step n={1} icon={<AndroidMenuIcon />} title={<>Appuie sur <strong>≡</strong> (menu) en bas du navigateur</>} />
        <Step n={2} icon={<AndroidAddIcon />} title={<>Appuie sur <strong>"Ajouter page à"</strong> puis <strong>"Écran d'accueil"</strong></>} />
        <Step n={3} icon={<div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-xl font-bold text-green-600">✓</div>} title="Confirme en appuyant sur Ajouter" />
        <Step n={4} icon={<div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>} title="Installé !" />
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {!isChrome && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          💡 Pour de meilleures performances, nous recommandons <strong>Google Chrome</strong> sur Android.
        </div>
      )}
      <Step n={1} icon={<AndroidMenuIcon />} title={<>Appuie sur <strong>⋮</strong> (3 points) en haut à droite de Chrome</>} />
      <Step n={2} icon={<AndroidAddIcon />} title={<>Appuie sur <strong>"Ajouter à l'écran d'accueil"</strong></>} />
      <Step n={3} icon={<div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-xl font-bold text-green-600">✓</div>} title={<>Appuie sur <strong>"Ajouter"</strong> pour confirmer</>} />
      <Step n={4} icon={<div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>} title={<>L'app <strong>CPF</strong> est installée !</>} />
      <p className="text-[11px] text-gray-400">Chrome peut aussi afficher une bannière d'installation automatique en bas — appuie dessus si elle apparaît !</p>
    </div>
  )
}

function desktopGuide() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Sur ordinateur, installe l'app via <strong>Chrome</strong> ou <strong>Edge</strong> :</p>
      <Step n={1} icon={<div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">⊕</div>} title={<>Cherche l'icône <strong>⊕</strong> dans la barre d'adresse</>} />
      <Step n={2} icon={<div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>} title={<>Clique <strong>"Installer"</strong></>} />
    </div>
  )
}

export function PWAGuide({ onConfirm, onRemindLater, onClose, standalone }: Props) {
  const { isIOS, isAndroid, isSamsung, isSafari, isChrome, isDesktop } = detectOS()
  const startY = useRef<number | null>(null)

  let osLabel = 'Appareil non reconnu'
  if (isIOS) osLabel = isSafari ? 'iPhone · Safari' : 'iPhone · Autre navigateur'
  else if (isAndroid) osLabel = isSamsung ? 'Android · Samsung Browser' : 'Android · Chrome'
  else if (isDesktop) osLabel = 'Ordinateur'

  function onTouchStart(e: React.TouchEvent) { startY.current = e.touches[0].clientY }
  function onTouchEnd(e: React.TouchEvent) {
    if (startY.current === null) return
    if (e.changedTouches[0].clientY - startY.current > 60) onClose()
    startY.current = null
  }

  const content = (
    <div className="overflow-y-auto" style={{ maxHeight: standalone ? undefined : 'calc(80vh - 64px)' }}>
      {/* Logo + titre */}
      <div className="px-5 pt-4 pb-3 flex flex-col items-center text-center gap-2">
        <img src="/logo-cpf.png" alt="CPF" className="h-12 w-12 object-contain" />
        <h2 className="text-lg font-bold text-gray-900">Installer l'app CPF</h2>
        <p className="text-sm text-gray-500">Accède au club en 1 tap, même sans connexion</p>
      </div>

      {/* Bénéfices */}
      <div className="mx-5 mb-4 bg-blue-50 rounded-xl p-3 space-y-1.5">
        {[
          ['⚡', 'Accès instantané depuis ton écran d\'accueil'],
          ['🔔', 'Reçois les notifications du club en temps réel'],
          ['📴', 'Fonctionne même avec peu de réseau'],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-2 text-sm text-blue-800">
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-100 mx-5" />

      {/* Guide OS */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm font-semibold text-gray-700">Comment faire ?</p>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{osLabel}</span>
        </div>
        {isIOS && iOSGuide(isSafari)}
        {isAndroid && androidGuide(isSamsung, isChrome)}
        {isDesktop && desktopGuide()}
        {!isIOS && !isAndroid && !isDesktop && androidGuide(false, false)}
      </div>

      <div className="h-px bg-gray-100 mx-5" />

      {/* Actions */}
      <div className="px-5 py-4 space-y-2">
        <Button onClick={onConfirm} className="w-full gap-2 bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4" /> J'ai installé l'app
        </Button>
        {!standalone && (
          <button onClick={onRemindLater} className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 py-2">
            <Clock className="h-3.5 w-3.5" /> Me rappeler dans 3 jours
          </button>
        )}
      </div>
    </div>
  )

  if (standalone) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="md:hidden fixed inset-0 z-[60] flex items-end" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white w-full rounded-t-[20px] shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh', animation: 'slideUpSheet 0.3s ease-out', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle + fermer */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-gray-200 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div />
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 ml-auto">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        {content}
      </div>
    </div>
  )
}
