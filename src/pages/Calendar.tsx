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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Toujours utiliser l'événement en direct depuis le tableau pour avoir les inscriptions à jour
  const selectedEvent = selectedEventId ? (events.find(e => e.id === selectedEventId) ?? null) : null
  const [showForm, setShowForm] = useState(false)
  const [calView, setCalView] = useState<View>('month')
  const [prefillDate, setPrefillDate] = useState<string>('')
  const [noAccessMsg, setNoAccessMsg] = useState<string | null>(null)

  // Clic sur un créneau vide du calendrier
  function handleSelectSlot({ start }: { start: Date }) {
    if (canCreateEvents) {
      // Pré-remplir date + heure par défaut (09:00)
      const y = start.getFullYear()
      const m = String(start.getMonth() + 1).padStart(2, '0')
      const d = String(start.getDate()).padStart(2, '0')
      setPrefillDate(`${y}-${m}-${d}T09:00`)
      setShowForm(true)
    } else {
      setNoAccessMsg('Réservé aux membres P3★ et plus')
      setTimeout(() => setNoAccessMsg(null), 3000)
    }
  }

  // Expanse les événements récurrents (FREQ=WEEKLY;BYDAY=XX) sur 12 mois
  const expandedEvents = useMemo(() => {
    const DAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
    const rangeStart = new Date(); rangeStart.setMonth(rangeStart.getMonth() - 1)
    const rangeEnd = new Date(); rangeEnd.setFullYear(rangeEnd.getFullYear() + 1)
    const result: Event[] = []

    for (const ev of events) {
      if (!ev.is_recurring || !ev.recurrence_rule) { result.push(ev); continue }
      const dayMatch = ev.recurrence_rule.match(/BYDAY=(\w{2})/)
      if (!dayMatch || !ev.recurrence_rule.includes('FREQ=WEEKLY')) { result.push(ev); continue }
      const targetDay = DAY[dayMatch[1]]
      if (targetDay === undefined) { result.push(ev); continue }

      const base = new Date(ev.date_start)
      const duration = ev.date_end
        ? new Date(ev.date_end).getTime() - base.getTime()
        : 90 * 60 * 1000

      const cur = new Date(rangeStart)
      cur.setHours(base.getHours(), base.getMinutes(), 0, 0)
      while (cur.getDay() !== targetDay) cur.setDate(cur.getDate() + 1)

      while (cur <= rangeEnd) {
        const occStart = new Date(cur)
        result.push({
          ...ev,
          id: `${ev.id}_${occStart.toISOString().slice(0, 10)}`,
          date_start: occStart.toISOString(),
          date_end: new Date(occStart.getTime() + duration).toISOString(),
        })
        cur.setDate(cur.getDate() + 7)
      }
    }
    return result
  }, [events])

  const calendarEvents: RBCEvent[] = useMemo(
    () =>
      expandedEvents.map((e) => ({
        title: e.is_recurring ? `🏊 ${e.title}` : e.title,
        start: new Date(e.date_start),
        end: e.date_end ? new Date(e.date_end) : new Date(e.date_start),
        resource: e,
      })),
    [expandedEvents],
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
            onSelectEvent={(rbc) => {
              const id = (rbc.resource as Event).id
              // Pour les occurrences récurrentes, id = "uuid_date" → on ouvre l'événement de base
              const baseId = id.length > 36 ? id.substring(0, 36) : id
              setSelectedEventId(baseId)
            }}
            onSelectSlot={handleSelectSlot}
            selectable
            style={{ height: calView === 'agenda' ? undefined : 600 }}
            components={{ toolbar: CalendarToolbar }}
            popup
          />
        )}
      </div>

      <EventModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEventId(null)}
      />

      {/* Message accès refusé */}
      {noAccessMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {noAccessMsg}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setPrefillDate('') }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
          </DialogHeader>
          <EventForm
            createdBy={profile.id}
            creatorRole={profile.role}
            creatorBrevet={profile.brevet_level}
            prefillDate={prefillDate}
            onSubmit={async (data) => {
              await createEvent(data)
              setShowForm(false)
              setPrefillDate('')
            }}
            onCancel={() => { setShowForm(false); setPrefillDate('') }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
