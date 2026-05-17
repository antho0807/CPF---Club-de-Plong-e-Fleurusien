import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, RefreshCw, Plus, Trash2, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface ExternalEvent {
  id: string
  title: string
  content: string | null
  url: string | null
  source: string | null
  event_date: string | null
  location: string | null
}

export function ExternalEvents() {
  const { isAdmin } = useAuth()
  const [events, setEvents] = useState<ExternalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('external_events')
      .select('*')
      .eq('active', true)
      .order('event_date', { ascending: true })
      .limit(20)
    setEvents((data ?? []) as ExternalEvent[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function syncNow() {
    setSyncing(true)
    try {
      await supabase.functions.invoke('fetch-lifras-events')
      await fetchEvents()
    } catch (e) {
      console.error(e)
    }
    setSyncing(false)
  }

  async function deleteEvent(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('external_events') as any).update({ active: false }).eq('id', id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const upcoming = events.filter((e) => !e.event_date || new Date(e.event_date) >= new Date())
  const past     = events.filter((e) => e.event_date && new Date(e.event_date) < new Date())

  if (loading) return null
  if (!upcoming.length && !isAdmin) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          🌊 Événements plongée utiles
        </CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={syncNow} disabled={syncing} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.length === 0 && isAdmin && (
          <p className="text-sm text-gray-400 text-center py-3">
            Aucun événement externe. Cliquez "Synchroniser" pour récupérer les événements LIFRAS.
          </p>
        )}
        {upcoming.map((ev) => (
          <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#0077b6]/20 hover:bg-blue-50/20 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-gray-900 truncate">{ev.title}</p>
                {ev.source && (
                  <Badge variant="outline" className="text-xs shrink-0">{ev.source}</Badge>
                )}
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
            <div className="flex gap-1 flex-shrink-0">
              {ev.url && (
                <a href={ev.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
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
        {past.length > 0 && isAdmin && (
          <p className="text-xs text-gray-400 pt-1">{past.length} événement(s) passé(s) masqué(s)</p>
        )}
      </CardContent>
    </Card>
  )
}
