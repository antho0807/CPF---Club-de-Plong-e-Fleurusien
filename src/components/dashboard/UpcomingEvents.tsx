import { Link } from 'react-router-dom'
import { MapPin, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useUpcomingEvents } from '../../hooks/useEvents'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, formatDate } from '../../lib/utils'
import type { EventType } from '../../types/database.types'

const BADGE_STYLES: Record<EventType, string> = {
  entrainement_piscine: 'bg-blue-50 text-blue-700 border-blue-100',
  sortie_mer:           'bg-orange-50 text-orange-700 border-orange-100',
  sortie_lac:           'bg-yellow-50 text-yellow-700 border-yellow-100',
  sortie_carriere:      'bg-red-50 text-red-700 border-red-100',
  formation:            'bg-teal-50 text-teal-700 border-teal-100',
  reunion:              'bg-gray-50 text-gray-600 border-gray-100',
  competition:          'bg-purple-50 text-purple-700 border-purple-100',
  autre:                'bg-gray-50 text-gray-600 border-gray-100',
}

export function UpcomingEvents() {
  const { events, loading } = useUpcomingEvents(3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-700">
          📅 Prochains événements
        </CardTitle>
        <Link to="/calendrier">
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-[#0077b6] hover:text-[#005f8e]">
            Voir tout <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        {loading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            Aucun événement prévu prochainement.
          </p>
        )}

        {!loading && events.map((event, idx) => {
          const color = EVENT_TYPE_COLORS[event.event_type]
          const badge = BADGE_STYLES[event.event_type]
          const registrationCount = event.event_registrations?.filter(r => r.status === 'confirmed').length ?? 0
          const isLast = idx === events.length - 1

          return (
            <Link key={event.id} to={`/calendrier?event=${event.id}`}>
              <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-100' : ''}`}>
                {/* Dot couleur */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {event.is_recurring ? '🏊 ' : ''}{event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {formatDate(event.date_start, 'EEE d MMM · HH:mm')}
                    </span>
                    {event.dive_sites && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <MapPin className="h-3 w-3" />{event.dive_sites.name}
                      </span>
                    )}
                    {registrationCount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Users className="h-3 w-3" />{registrationCount}{event.max_participants ? `/${event.max_participants}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge type */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:inline ${badge}`}>
                  {EVENT_TYPE_LABELS[event.event_type]}
                </span>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
