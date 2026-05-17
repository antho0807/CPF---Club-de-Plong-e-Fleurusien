import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from './ui/button'

export function GdprConsent() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('gdpr_consent')
      .select('id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) setShow(true)
      })
  }, [user?.id])

  async function accept() {
    if (!user?.id) return
    setLoading(true)
    await supabase.from('gdpr_consent').upsert({ user_id: user.id, version: '1.0' })
    setShow(false)
    setLoading(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#0077b6]" />
          </div>
          <h2 className="font-bold text-gray-900">Protection de vos données</h2>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          L'application CPF Plongée collecte vos données personnelles (nom, email, niveau LIFRAS, certificat médical) pour la gestion des membres et activités du club.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Données hébergées sur <strong>Supabase (UE)</strong>. Aucune vente à des tiers. Conformément au <strong>RGPD</strong>.
        </p>
        <p className="text-xs text-gray-400 mb-5">
          Vous pouvez demander l'accès, la modification ou la suppression de vos données à <a href="mailto:info@cpfleurusien.be" className="text-[#0077b6]">info@cpfleurusien.be</a>.
        </p>

        <div className="flex gap-3">
          <Button onClick={accept} disabled={loading} className="flex-1">
            {loading ? 'Enregistrement…' : 'J\'accepte'}
          </Button>
          <a href="/utile" className="flex-1">
            <Button variant="ghost" className="w-full text-xs text-gray-500">
              En savoir plus
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
