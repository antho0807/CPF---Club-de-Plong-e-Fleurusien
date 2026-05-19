import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, RefreshCw, Plus, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface ExternalEvent {
  id: string; title: string; content: string | null
  url: string | null; source: string | null
  event_date: string | null; location: string | null
}

export function ExternalEvents() {
  const { isAdmin, canCreateEvents } = useAuth()
  const [events, setEvents] = useState<ExternalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [url, setUrl] = useState('')
  const [source, setSource] = useState('')
  const [content, setContent] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('external_events') as any)
      .select('*').eq('active', true).order('event_date', { ascending: true }).limit(30)
    setEvents((data ?? []) as ExternalEvent[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function syncNow() {
    setSyncing(true)
    try { await supabase.functions.invoke('fetch-lifras-events'); await fetchEvents() }
    catch (e) { console.error(e) }
    setSyncing(false)
  }

  async function deleteEvent(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('external_events') as any).update({ active: false }).eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  async function addEvent() {
    if (!title) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('external_events') as any).insert({
      title, event_date: eventDate || null, location: location || null,
      url: url || null, source: source || 'Manuel', content: content || null, active: true,
    })
    setTitle(''); setEventDate(''); setLocation(''); setUrl(''); setSource(''); setContent('')
    setShowForm(false); await fetchEvents(); setSaving(false)
  }

  const now = new Date()
  const upcoming = events.filter(e => !e.event_date || new Date(e.event_date) >= now)
  const past = events.filter(e => e.event_date && new Date(e.event_date) < now)

  if (loading) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-700">🌊 Événements plongée utiles</CardTitle>
        <div className="flex gap-2">
          {(isAdmin || canCreateEvents) && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5 h-7 text-xs">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" variant="ghost" onClick={syncNow} disabled={syncing} className="gap-1.5 h-7 text-xs text-gray-400">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> LIFRAS
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-3 space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucun événement externe à venir.{(isAdmin || canCreateEvents) ? ' Ajoutez-en un !' : ''}
          </p>
        ) : upcoming.map(ev => (
          <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#0077b6]/20 hover:bg-blue-50/20 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-gray-900 leading-snug">{ev.title}</p>
                {ev.source && <Badge variant="outline" className="text-xs shrink-0">{ev.source}</Badge>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                {ev.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(ev.event_date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
                {ev.location && <span>📍 {ev.location}</span>}
              </div>
              {ev.content && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ev.content}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              {ev.url && (
                <a href={ev.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ExternalLink className="h-3.5 w-3.5" /></Button>
                </a>
              )}
              {isAdmin && (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:bg-red-50" onClick={() => deleteEvent(ev.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {isAdmin && past.length > 0 && (
          <>
            <button onClick={() => setShowPast(v => !v)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 pt-1">
              {showPast ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {past.length} événement{past.length > 1 ? 's' : ''} passé{past.length > 1 ? 's' : ''}
            </button>
            {showPast && past.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-50 opacity-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">{ev.title}</p>
                  {ev.event_date && <p className="text-xs text-gray-400">{new Date(ev.event_date).toLocaleDateString('fr-BE')}</p>}
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => deleteEvent(ev.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter un événement plongée</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre *</Label><Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="Compétition LIFRAS, stage..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" className="mt-1" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
              <div><Label>Source</Label><Input className="mt-1" value={source} onChange={e => setSource(e.target.value)} placeholder="LIFRAS, club..." /></div>
            </div>
            <div><Label>Lieu</Label><Input className="mt-1" value={location} onChange={e => setLocation(e.target.value)} placeholder="Piscine, carrière..." /></div>
            <div><Label>Lien URL</Label><Input className="mt-1" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
            <div><Label>Description <span className="text-gray-400 text-xs">(optionnel)</span></Label><Input className="mt-1" value={content} onChange={e => setContent(e.target.value)} placeholder="Détails, inscriptions..." /></div>
            <div className="flex gap-2 pt-1">
              <Button onClick={addEvent} disabled={saving || !title}>{saving ? 'Ajout…' : 'Ajouter'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
