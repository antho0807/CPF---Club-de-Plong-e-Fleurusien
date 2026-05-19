import { useState, useCallback, useEffect } from 'react'
import { Plus, Calendar, MapPin, FileText, Users, ChevronDown, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import type { CAMeeting, MeetingStatus } from '../../types/database.types'

const STATUS_LABELS: Record<MeetingStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}
const STATUS_COLORS: Record<MeetingStatus, string> = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function MeetingsTab() {
  const { profile } = useAuth()
  const [meetings, setMeetings] = useState<CAMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<CAMeeting | null>(null)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [agenda, setAgenda] = useState('')
  const [saving, setSaving] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ca_meetings')
      .select('*, ca_meeting_attendees(member_id, present, profiles(full_name, alias))')
      .order('meeting_date', { ascending: false })
    setMeetings((data ?? []) as unknown as CAMeeting[])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  async function handleSave() {
    if (!title || !date) return
    setSaving(true)
    await supabase.from('ca_meetings').insert({
      title, meeting_date: new Date(date).toISOString(),
      location: location || null, agenda: agenda || null,
      created_by: profile?.id,
    })
    setTitle(''); setDate(''); setLocation(''); setAgenda('')
    setShowForm(false)
    await refetch()
    setSaving(false)
  }

  async function updateStatus(id: string, status: MeetingStatus) {
    await supabase.from('ca_meetings').update({ status }).eq('id', id)
    await refetch()
  }

  async function saveMinutes(id: string, minutes: string) {
    await supabase.from('ca_meetings').update({ minutes }).eq('id', id)
    await refetch()
    setSelected(s => s ? { ...s, minutes } : s)
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{meetings.length} réunion(s)</p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Planifier
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune réunion enregistrée.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map(m => {
            const d = new Date(m.meeting_date)
            const dateStr = d.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
            const timeStr = d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {dateStr} à {timeStr}
                      {m.location && <><MapPin className="h-3 w-3 ml-1" />{m.location}</>}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-xs shrink-0 ${STATUS_COLORS[m.status]}`}>
                    {STATUS_LABELS[m.status]}
                  </Badge>
                </div>

                {m.agenda && <p className="text-xs text-gray-400 line-clamp-2">{m.agenda}</p>}

                <div className="flex gap-2 flex-wrap pt-1">
                  {m.status === 'planned' && (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => updateStatus(m.id, 'in_progress')}>
                      <Check className="h-3 w-3" /> Démarrer
                    </Button>
                  )}
                  {m.status === 'in_progress' && (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-green-600 border-green-200" onClick={() => updateStatus(m.id, 'completed')}>
                      <Check className="h-3 w-3" /> Terminer
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => setSelected(m)}>
                    <FileText className="h-3 w-3" /> PV / Compte-rendu
                  </Button>
                  {m.status === 'planned' && (
                    <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-red-500" onClick={() => updateStatus(m.id, 'cancelled')}>
                      <X className="h-3 w-3" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form nouvelle réunion */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Planifier une réunion</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre *</Label><Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="Réunion CA mensuelle" /></div>
            <div><Label>Date et heure *</Label><Input type="datetime-local" className="mt-1" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label>Lieu</Label><Input className="mt-1" value={location} onChange={e => setLocation(e.target.value)} placeholder="Salle de réunion, Zoom…" /></div>
            <div><Label>Ordre du jour</Label><Textarea className="mt-1" rows={3} value={agenda} onChange={e => setAgenda(e.target.value)} /></div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving || !title || !date}>{saving ? 'Enregistrement…' : 'Créer'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog PV */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Compte-rendu — {selected.title}</DialogTitle></DialogHeader>
            <PVEditor meeting={selected} onSave={saveMinutes} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function PVEditor({ meeting, onSave }: { meeting: CAMeeting; onSave: (id: string, minutes: string) => Promise<void> }) {
  const [text, setText] = useState(meeting.minutes ?? '')
  const [saving, setSaving] = useState(false)
  return (
    <div className="space-y-3">
      <Textarea rows={12} value={text} onChange={e => setText(e.target.value)} placeholder="Rédigez le compte-rendu de la réunion…" className="font-mono text-sm" />
      <Button onClick={async () => { setSaving(true); await onSave(meeting.id, text); setSaving(false) }} disabled={saving}>
        {saving ? 'Enregistrement…' : 'Sauvegarder le PV'}
      </Button>
    </div>
  )
}
