import { BellOff, CheckCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { formatDate } from '../lib/utils'

const TYPE_ICONS: Record<string, string> = {
  registration_pending:   '📋',
  registration_confirmed: '✅',
  registration_refused:   '❌',
  exercise_validated:     '🏅',
  exercise_refused:       '⚠️',
  new_message:            '💬',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)    return 'À l\'instant'
  if (mins < 60)   return `Il y a ${mins} min`
  if (hours < 24)  return `Il y a ${hours}h`
  if (days < 7)    return `Il y a ${days} j`
  return formatDate(dateStr, 'dd/MM/yyyy')
}

export function Notifications() {
  const { profile } = useAuth()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(profile?.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-medium text-[#0077b6] hover:text-[#005f8e] transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <BellOff className="h-10 w-10 text-gray-200" />
          <p className="text-sm text-gray-400">Aucune notification récente.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {notifications.map((n) => {
            const isUnread = !n.read_at
            const icon = TYPE_ICONS[n.type] ?? '🔔'
            return (
              <button
                key={n.id}
                onClick={() => { if (isUnread) markRead(n.id) }}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                  isUnread ? 'bg-blue-50/60' : 'bg-white'
                }`}
              >
                {/* Indicateur non-lu */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full mt-1 ${isUnread ? 'bg-[#0077b6]' : 'bg-transparent'}`} />
                </div>

                {/* Icône type */}
                <span className="text-xl flex-shrink-0 leading-none mt-0.5">{icon}</span>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
