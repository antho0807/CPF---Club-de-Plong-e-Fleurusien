import { useState } from 'react'
import { Bell, Send, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { useNotificationPreferences, NOTIF_PREF_LABELS, type NotifPrefKey } from '../../hooks/useNotificationPreferences'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Button } from '../../components/ui/button'

export function NotificationsTab() {
  const { profile } = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications(profile?.id)
  const { prefs, loading, saving, updatePref } = useNotificationPreferences(profile?.id)
  const { supported, subscribed, loading: pushLoading, toggle } = usePushNotifications(profile?.id ?? null)
  const [testState, setTestState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState<string | null>(null)

  async function sendTestPush() {
    if (!profile?.id) return
    setTestState('sending')
    setTestError(null)
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: [profile.id],
          title: '🔔 Test CPF Plongée',
          body: 'Les notifications push fonctionnent correctement !',
          url: '/parametres',
        },
      })
      if (error) throw new Error(error.message)
      setTestState('ok')
      setTimeout(() => setTestState('idle'), 4000)
    } catch (e) {
      setTestError(e instanceof Error ? e.message : String(e))
      setTestState('error')
    }
  }

  return (
    <div className="space-y-8">
      {/* Statut abonnement push */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-gray-800">Notifications push sur cet appareil</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {!supported
              ? 'Non supportées par ce navigateur'
              : subscribed
              ? 'Activées — vous recevez les notifications'
              : 'Désactivées — cliquez pour les activer'}
          </p>
        </div>
        {supported && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {subscribed && (
              <Button
                size="sm"
                variant="outline"
                disabled={testState === 'sending'}
                onClick={sendTestPush}
                className="gap-2 text-xs"
              >
                <Send className="h-3.5 w-3.5" />
                {testState === 'sending' ? 'Envoi…' : 'Tester'}
              </Button>
            )}
            <Button size="sm" variant={subscribed ? 'outline' : 'default'} disabled={pushLoading} onClick={toggle} className="text-xs">
              {pushLoading ? '…' : subscribed ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
        )}
      </div>

      {testState === 'ok' && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Push envoyé ! Vous devriez recevoir la notification dans quelques secondes.
        </div>
      )}
      {testState === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {testError ?? 'Erreur lors de l\'envoi. Vérifiez les clés VAPID dans Supabase.'}
        </div>
      )}

      {/* Préférences push */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Notifications push</h2>
        <p className="text-xs text-gray-400 mb-4">Choisissez les types de notifications que vous souhaitez recevoir.</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(Object.entries(NOTIF_PREF_LABELS) as [NotifPrefKey, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">{label}</span>
                <div className="relative ml-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={prefs[key]}
                    disabled={saving}
                    onChange={(e) => updatePref(key, e.target.checked)}
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-[#0077b6] rounded-full transition-colors peer-disabled:opacity-50" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Historique des notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Historique
            {unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-[#0077b6] hover:underline">
              Tout marquer comme lu
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune notification.</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 20).map((n) => (
              <div key={n.id} className={`p-3 rounded-xl border text-sm ${!n.read_at ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}`}>
                <p className="font-semibold text-gray-900">{n.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{n.body}</p>
                <p className="text-gray-400 text-xs mt-1">{formatDate(n.created_at, 'dd/MM/yyyy HH:mm')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
