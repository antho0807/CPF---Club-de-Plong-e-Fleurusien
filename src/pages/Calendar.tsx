import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Plus, ChevronLeft, ChevronRight, Users, MapPin } from 'lucide-react'
import { useEvents } from '../hooks/useEvents'
import { useAuth } from '../hooks/useAuth'
import { useBirthdays } from '../hooks/useBirthdays'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '../lib/utils'
import { Button } from '../components/ui/button'
import { EventModal } from '../components/events/EventModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { EventForm } from '../components/events/EventForm'
import type { Event } from '../types/database.types'

const locales = { fr }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const messages = {
  allDay: 'Journée', previous: '‹', next: '›', today: "Aujourd'hui",
  month: 'Mois', week: 'Semaine', day: 'Jour', agenda: 'Agenda',
  date: 'Date', time: 'Heure', event: 'Événement',
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
        <button onClick={() => nav('PREV')} aria-label="Précédent"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <button onClick={() => nav('TODAY')}
          className="px-3 h-8 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700">
          Aujourd'hui
        </button>
        <button onClick={() => nav('NEXT')} aria-label="Suivant"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize ml-1">{label}</span>
      </div>
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
        {VIEW_OPTIONS.map(({ key, label: l }) => (
          <button key={key} onClick={() => onView(key)}
            className={`px-3 h-7 text-xs font-medium rounded-md transition-colors ${
              view === key ? 'bg-white text-[#0077b6] shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}>{l}</button>
        ))}
      </div>
    </div>
  )
}

export function Calendar() {
  const navigate = useNavigate()
  const { events, loading, createEvent } = useEvents()
  const { canCreateEvents, profile } = useAuth()
  const birthdays = useBirthdays(profile?.id)

  const [dayPopup, setDayPopup] = useState<Date | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const selectedEvent = selectedEventId ? (events.find(e => e.id === selectedEventId) ?? null) : null

  const [showForm, setShowForm] = useState(false)
  const [calView, setCalView] = useState<View>('month')
  const [calDate, setCalDate] = useState(new Date())
  const [prefillDate, setPrefillDate] = useState<string>('')

  // ── En vue mois : clic sur créneau vide → popup du jour
  //    En vue semaine/agenda : clic → créer event directement
  function handleSelectSlot({ start }: { start: Date }) {
    if (calView === 'month') {
      setDayPopup(start)
    } else if (canCreateEvents) {
      const y = start.getFullYear()
      const m = String(start.getMonth() + 1).padStart(2, '0')
      const d = String(start.getDate()).padStart(2, '0')
      const h = String(start.getHours()).padStart(2, '0')
      const mi = String(start.getMinutes()).padStart(2, '0')
      setPrefillDate(`${y}-${m}-${d}T${h}:${mi}`)
      setShowForm(true)
    }
  }

  // ── Expansion des événements récurrents ──────────────────
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
      const duration = ev.date_end ? new Date(ev.date_end).getTime() - base.getTime() : 90 * 60 * 1000
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

  // ── Events RBC — fériés inclus (stylés différemment) ─────
  const calendarEvents: RBCEvent[] = useMemo(
    () => expandedEvents.map((e) => ({
      title: e.is_recurring && e.event_type !== 'ferie' ? `🏊 ${e.title}` : e.title,
      start: new Date(e.date_start),
      end: e.date_end ? new Date(e.date_end) : new Date(e.date_start),
      resource: e,
    })),
    [expandedEvents],
  )

  // ── Style des events ──────────────────────────────────────
  const eventPropGetter = useCallback((rbc: RBCEvent) => {
    const e = rbc.resource as Event
    if (e.event_type === 'ferie') {
      return {
        style: {
          backgroundColor: 'transparent',
          color: '#bbb',
          border: 'none',
          boxShadow: 'none',
          fontSize: '9px',
          fontStyle: 'italic',
          padding: '0 2px',
          cursor: 'default',
          pointerEvents: 'none' as const,
        },
      }
    }
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

  // ── Fond grisé sur les jours fériés ──────────────────────
  const dayPropGetter = useCallback((date: Date) => {
    const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    const isHoliday = events.some(e => e.event_type === 'ferie' && e.date_start.slice(0,10) === iso)
    return isHoliday ? { style: { backgroundColor: '#f9fafb' } } : {}
  }, [events])

  // ── Rendu custom de l'event en vue mois (fériés = texte italic) ──
  const MonthEventComponent = useCallback(({ event }: { event: RBCEvent }) => {
    const ev = event.resource as Event
    if (ev.event_type === 'ferie') {
      const name = ev.title.replace(/^Jour férié — /, '').replace(/[🎄🇧🇪]/g, '').trim()
      return <span style={{ fontSize: '9px', fontStyle: 'italic', color: '#bbb', display: 'block', textAlign: 'center' }}>{name}</span>
    }
    return <span>{event.title as string}</span>
  }, [])

  // ── Date header : chiffre + 🎂 si anniversaire ────────────
  const DateHeaderComponent = useCallback(({ date, label }: {
    date: Date; label: string; onDrillDown: (e: React.SyntheticEvent) => void
  }) => {
    const dayBdays = birthdays.filter(b => b.day === date.getDate() && b.month === date.getMonth() + 1)
    return (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <button onClick={(e) => { e.stopPropagation(); setDayPopup(date) }} className="rbc-button-link">
          {label}
        </button>
        {dayBdays.length > 0 && (
          <span
            title={dayBdays.map(b => `🎂 ${b.name}`).join(' · ')}
            onClick={(e) => { e.stopPropagation(); setDayPopup(date) }}
            style={{ fontSize: '11px', cursor: 'pointer', lineHeight: 1, display: 'inline-block' }}
          >🎂</span>
        )}
      </span>
    )
  }, [birthdays])

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
            <Plus className="h-4 w-4" /> Créer un événement
          </Button>
        )}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(EVENT_TYPE_COLORS)
          .filter(([type]) => type !== 'ferie')
          .map(([type, color]) => (
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
            date={calDate}
            onNavigate={setCalDate}
            view={calView}
            onView={setCalView}
            views={['month', 'week', 'agenda']}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            components={{
              toolbar: CalendarToolbar,
              month: {
                dateHeader: DateHeaderComponent,
                event: MonthEventComponent,
              },
            }}
            scrollToTime={new Date(1970, 1, 1, 8, 0)}
            onSelectEvent={(rbc) => {
              const e = rbc.resource as Event
              if (e.event_type === 'ferie') return
              const baseId = e.id.length > 36 ? e.id.substring(0, 36) : e.id
              setSelectedEventId(baseId)
            }}
            onSelectSlot={handleSelectSlot}
            selectable
            style={{ height: calView === 'agenda' ? undefined : 600 }}
            popup
          />
        )}
      </div>

      {/* Modal event existant */}
      <EventModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEventId(null)}
      />

      {/* ══ POPUP RÉCAPITULATIF DU JOUR ══ */}
      {dayPopup && (() => {
        const d = dayPopup
        const isoDay = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        const dayRegularEvents = expandedEvents.filter(e => e.date_start.slice(0,10) === isoDay && e.event_type !== 'ferie')
        const dayHoliday = expandedEvents.find(e => e.date_start.slice(0,10) === isoDay && e.event_type === 'ferie')
        const dayBdays = birthdays.filter(b => b.day === d.getDate() && b.month === d.getMonth()+1)
        const holidayName = dayHoliday?.title.replace(/^Jour férié — /, '').replace(/[🎄🇧🇪🎊]/g, '').trim()
        const dateLabel = d.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

        function openCreate() {
          const y = d.getFullYear()
          const mo = String(d.getMonth()+1).padStart(2,'0')
          const dy = String(d.getDate()).padStart(2,'0')
          setPrefillDate(`${y}-${mo}-${dy}T09:00`)
          setShowForm(true)
          setDayPopup(null)
        }

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setDayPopup(null)}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Popup — bottom sheet sur mobile, modal sur desktop */}
            <div
              className="relative bg-white w-full sm:max-w-[420px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
              onClick={e => e.stopPropagation()}
              style={{ animation: 'slideUp 0.2s ease-out' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <p className="font-bold text-gray-900 capitalize text-base leading-tight">{dateLabel}</p>
                  {dayHoliday && (
                    <p className="text-xs text-gray-400 italic mt-0.5">📅 Jour férié — {holidayName}</p>
                  )}
                </div>
                <button onClick={() => setDayPopup(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-3 mt-0.5">×</button>
              </div>

              {/* Contenu scrollable */}
              <div className="overflow-y-auto flex-1">

                {/* A) Timeline des événements */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Événements</p>
                  {dayRegularEvents.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Aucun événement ce jour.</p>
                  ) : (
                    <div className="space-y-2">
                      {dayRegularEvents
                        .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
                        .map((ev, i) => {
                          const color = EVENT_TYPE_COLORS[ev.event_type]
                          const time = new Date(ev.date_start).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
                          const confirmed = ev.event_registrations?.filter(r => r.status === 'confirmed').length ?? 0
                          return (
                            <div
                              key={ev.id + i}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                              onClick={() => {
                                const baseId = ev.id.length > 36 ? ev.id.substring(0, 36) : ev.id
                                setSelectedEventId(baseId)
                                setDayPopup(null)
                              }}
                            >
                              <div className="flex-shrink-0 text-right">
                                <p className="text-xs font-mono font-semibold text-gray-500 w-10">{time}</p>
                              </div>
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: color }} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold text-gray-900 leading-snug ${ev.is_cancelled ? 'line-through text-gray-400' : ''}`}>
                                  {ev.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {ev.dive_sites && (
                                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                      <MapPin className="h-3 w-3" />
                                      {(ev.dive_sites as { name: string }).name}
                                    </span>
                                  )}
                                  {confirmed > 0 && (
                                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                      <Users className="h-3 w-3" />
                                      {confirmed}{ev.max_participants ? `/${ev.max_participants}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-gray-300 text-sm flex-shrink-0">›</span>
                            </div>
                          )
                        })
                      }
                    </div>
                  )}
                </div>

                {/* B) Anniversaires */}
                {dayBdays.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">🎂 Anniversaires</p>
                    <div className="space-y-1.5">
                      {dayBdays.map((b) => (
                        <button
                          key={b.userId}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-pink-50 transition-colors text-left"
                          onClick={() => { navigate(`/membres/${b.userId}`); setDayPopup(null) }}
                        >
                          <span className="text-lg leading-none">🎂</span>
                          <span className="text-sm font-semibold text-gray-800">{b.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">Voir le profil →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* C) Jour férié */}
                {dayHoliday && (
                  <div className="px-5 py-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 italic">📅 Jour férié — {holidayName}</p>
                  </div>
                )}
              </div>

              {/* D) Bouton créer event */}
              {canCreateEvents && (
                <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
                  <button
                    onClick={openCreate}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#0077b6] hover:text-[#005f8e] py-2.5 rounded-xl hover:bg-blue-50 transition-colors border border-blue-100"
                  >
                    <Plus className="h-4 w-4" /> Créer un événement ce jour
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Formulaire création event */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setPrefillDate('') }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Créer un événement</DialogTitle></DialogHeader>
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
