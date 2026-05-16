import { useState, useCallback, useMemo } from 'react'
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type Event as RBCEvent,
  type ToolbarProps,
  type NavigateAction,
  type View,
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEvents } from '../hooks/useEvents'
import { useAuth } from '../hooks/useAuth'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '../lib/utils'
import { Button } from '../components/ui/button'
import { EventModal } from '../components/events/EventModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { EventForm } from '../components/events/EventForm'
import type { Event } from '../types/database.types'

const locales = { fr }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const messages = {
  allDay: 'Journée',
  previous: '‹',
  next: '›',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun événement sur cette période.',
  showMore: (count: number) => `+ ${count} autre${count > 1 ? 's' : ''}`,
}

const VIEW_OPTIONS: { key: View; label: string }[] = [
  { key: 'month', label: 'Mois' },
  { key: 'week', label: 'Semaine' },
  { key: 'agenda', label: 'Agenda' },
]

function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps) {
  const nav = (action: NavigateAction) => onNavigate(action)
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 flex-wrap border-b border-gray-100">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => nav('PREV')}
          aria-label="Précédent"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <button
          onClick={() => nav('TODAY')}
          className="px-3 h-8 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700"
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => nav('NEXT')}
          aria-label="Suivant"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize ml-1">{label}</span>
      </div>
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
        {VIEW_OPTIONS.map(({ key, label: l }) => (
          <button
            key={key}
            onClick={() => onView(key)}
            className={`px-3 h-7 text-xs font-medium rounded-md transition-colors ${
              view === key
                ? 'bg-white text-[#0077b6] shadow-sm font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Calendar() {
  const { events, loading, createEvent } = useEvents()
  const { canCreateEvents, profile } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [calView, setCalView] = useState<View>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'agenda' : 'month'
  )

  const calendarEvents: RBCEvent[] = useMemo(
    () =>
      events.map((e) => ({
        title: e.title,
        start: new Date(e.date_start),
        end: e.date_end ? new Date(e.date_end) : new Date(e.date_start),
        resource: e,
      })),
    [events],
  )

  const eventPropGetter = useCallback((rbc: RBCEvent) => {
    const e = rbc.resource as Event
    const color = EVENT_TYPE_COLORS[e.event_type]
    return {
      style: {
        backgroundColor: e.is_cancelled ? '#9ca3af' : color,
        opacity: e.is_cancelled ? 0.6 : 1,
        borderRadius: '4px',
        border: 'none',
        color: '#fff',
        fontSize: '0.72rem',
        fontWeight: '500',
        padding: '1px 5px',
      },
    }
  }, [])

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
        <p className="text-sm text-gray-500">Chargement du profil…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} événements enregistrés</p>
        </div>
        {canCreateEvents && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer un événement
          </Button>
        )}
      </div>

      {/* Légende des types */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS]}
          </div>
        ))}
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
          </div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            culture="fr"
            messages={messages}
            view={calView}
            onView={setCalView}
            views={['month', 'week', 'agenda']}
            eventPropGetter={eventPropGetter}
            onSelectEvent={(rbc) => setSelectedEvent(rbc.resource as Event)}
            style={{ height: calView === 'agenda' ? undefined : 600 }}
            components={{ toolbar: CalendarToolbar }}
            popup
          />
        )}
      </div>

      <EventModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
          </DialogHeader>
          <EventForm
            createdBy={profile.id}
            creatorRole={profile.role}
            creatorBrevet={profile.brevet_level}
            onSubmit={async (data) => {
              await createEvent(data)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
