import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useUpcomingEvents } from '../../hooks/useEvents'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, formatDateTime } from '../../lib/utils'

export function UpcomingEvents() {
  const { events, loading } = useUpcomingEvents(3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#0077b6]" />
          Prochains événements
        </CardTitle>
        <Link to="/calendrier">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            Voir tout <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun événement prévu dans les prochains jours.
          </p>
        )}

        {!loading && events.map((event) => {
          const color = EVENT_TYPE_COLORS[event.event_type]
          const registrationCount = event.event_registrations?.length ?? 0
          return (
            <Link key={event.id} to={`/calendrier?event=${event.id}`}>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#0077b6]/30 hover:bg-blue-50/30 transition-colors cursor-pointer">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {EVENT_TYPE_LABELS[event.event_type]} · {formatDateTime(event.date_start)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {event.dive_sites && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {event.dive_sites.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      {registrationCount}
                      {event.max_participants ? `/${event.max_participants}` : ''} inscrits
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
