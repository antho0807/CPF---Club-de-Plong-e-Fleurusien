import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createNotification } from './useNotifications'
import type { TablesInsert, TablesUpdate } from '../types/supabase'
import type {
  Event, EventExercise, EventMessage, EventRegistration,
  MemberExerciseProgress,
} from '../types/database.types'

function asEvents(data: unknown): Event[] {
  return (data ?? []) as Event[]
}

// Prénom + initiale du nom, ou alias, ex : "Tom A."
function displayName(p: { alias?: string | null; full_name?: string | null } | null): string {
  if (!p) return 'Un membre'
  if (p.alias) return p.alias
  if (!p.full_name) return 'Un membre'
  const parts = p.full_name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
}

// "19 mai", "18 juin", etc.
function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*, dive_sites(*), event_registrations(*, profiles(*))')
      .order('date_start')
    setEvents(asEvents(data))
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  async function createEvent(event: Partial<Event>): Promise<void> {
    const { dive_sites: _d, event_registrations: _r, ...insertable } = event as Record<string, unknown>
    const { data: newEvent, error } = await supabase
      .from('events')
      .insert(insertable as TablesInsert<'events'>)
      .select('id')
      .single()
    if (error) throw error

    // Inscrire automatiquement le créateur avec statut "confirmed"
    if (newEvent?.id && insertable.created_by) {
      await supabase.from('event_registrations').insert({
        event_id: newEvent.id,
        member_id: insertable.created_by as string,
        status: 'confirmed',
      })
    }

    await refetch()
  }

  async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    const { dive_sites: _d, event_registrations: _r, id: _id, created_at: _c, created_by: _cb, ...updatable } =
      updates as Record<string, unknown>
    const { error } = await supabase
      .from('events')
      .update(updatable as TablesUpdate<'events'>)
      .eq('id', id)
    if (error) throw error
    await refetch()
  }

  async function cancelEvent(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({ is_cancelled: true, cancel_reason: reason })
      .eq('id', id)
    if (error) throw error
    await refetch()
  }

  /**
   * Inscription d'un membre → statut "pending" par défaut.
   * Crée une notification pour l'organisateur de l'événement.
   */
  async function registerToEvent(eventId: string, memberId: string, memberName?: string): Promise<void> {
    const { error } = await supabase.from('event_registrations').insert({
      event_id: eventId,
      member_id: memberId,
      status: 'pending',
    })
    if (error) throw error

    const event = events.find((e) => e.id === eventId)
    // Pas de notification pour les entraînements récurrents (spam)
    if (event?.organizer_id && !event.is_recurring) {
      const dateStr = event.date_start ? ` du ${shortDate(event.date_start)}` : ''
      await createNotification({
        userId: event.organizer_id,
        type: 'registration_pending',
        title: '📋 Nouvelle demande d\'inscription',
        body: `${memberName ?? 'Un membre'} souhaite rejoindre « ${event.title} »${dateStr}.`,
        data: { eventId, memberId },
      })
    }

    await refetch()
  }

  async function unregisterFromEvent(eventId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('member_id', memberId)
    if (error) throw error
    await refetch()
  }

  /**
   * Validation ou refus d'une inscription par l'organisateur.
   * Crée une notification pour le membre concerné.
   */
  async function validateRegistration(
    eventId: string,
    memberId: string,
    accept: boolean,
  ): Promise<void> {
    const newStatus = accept ? 'confirmed' : 'refused'
    const { data, error } = await supabase
      .from('event_registrations')
      .update({ status: newStatus })
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .select()
    if (error) throw error
    if (!data || data.length === 0) throw new Error('Validation refusée. Vérifiez vos droits.')

    const event = events.find((e) => e.id === eventId)
    const eventTitle = event?.title ?? 'un événement'
    const eventDateShort = event?.date_start ? ` du ${shortDate(event.date_start)}` : ''
    const eventDateLong = event?.date_start
      ? new Date(event.date_start).toLocaleDateString('fr-BE', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      : 'date à confirmer'

    // Récupérer le profil du membre (nom + email)
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('email, full_name, alias')
      .eq('id', memberId)
      .maybeSingle()

    const memberDisplay = displayName(memberProfile)

    if (accept && memberProfile) {
      const eventLocation = (event as unknown as { dive_sites?: { name?: string } })?.dive_sites?.name
      supabase.functions.invoke('send-confirmation-email', {
        body: { to: memberProfile.email, memberName: memberProfile.full_name, eventTitle, eventDate: eventDateLong, eventLocation },
      }).catch(console.error)
    }

    // Notifier le membre concerné
    await createNotification({
      userId: memberId,
      type: accept ? 'registration_confirmed' : 'registration_refused',
      title: accept ? '✅ Inscription confirmée !' : '❌ Inscription refusée',
      body: accept
        ? `Votre inscription à « ${eventTitle} »${eventDateShort} a été validée.`
        : `Votre inscription à « ${eventTitle} »${eventDateShort} a été refusée.`,
      data: { eventId },
    })

    // Notifier les autres participants confirmés qu'un nouveau membre a rejoint
    // Pas de notification pour les entraînements récurrents (ex: piscine du mardi)
    if (accept && !event?.is_recurring) {
      const { data: confirmedRegs } = await supabase
        .from('event_registrations')
        .select('member_id')
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .neq('member_id', memberId)

      await Promise.all((confirmedRegs ?? []).map((reg) =>
        createNotification({
          userId: reg.member_id,
          type: 'registration_confirmed',
          title: '🤿 Nouveau participant',
          body: `${memberDisplay} a rejoint « ${eventTitle} »${eventDateShort}.`,
          data: { eventId },
        })
      ))
    }

    await refetch()
  }

  return {
    events,
    loading,
    refetch,
    createEvent,
    updateEvent,
    cancelEvent,
    registerToEvent,
    unregisterFromEvent,
    validateRegistration,
  }
}

// ─── Exercices ────────────────────────────────────────────────

export function useEventExercises(eventId: string | null) {
  const [exercises, setExercises] = useState<EventExercise[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return }
    const { data } = await supabase
      .from('event_exercises')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index')
    setExercises((data ?? []) as EventExercise[])
    setLoading(false)
  }, [eventId])

  useEffect(() => { refetch() }, [refetch])

  async function addExercise(ex: Pick<EventExercise, 'title' | 'description' | 'min_brevet' | 'created_by'>): Promise<void> {
    await supabase.from('event_exercises').insert({
      event_id: eventId!,
      title: ex.title,
      description: ex.description,
      min_brevet: ex.min_brevet,
      order_index: exercises.length,
      created_by: ex.created_by,
    })
    await refetch()
  }

  async function removeExercise(id: string): Promise<void> {
    await supabase.from('event_exercises').delete().eq('id', id)
    await refetch()
  }

  return { exercises, loading, addExercise, removeExercise, refetch }
}

// ─── Progression membre ──────────────────────────────────────

export function useMemberProgress(memberId: string | null, eventId: string | null) {
  const [progress, setProgress] = useState<MemberExerciseProgress[]>([])

  const refetch = useCallback(async () => {
    if (!memberId || !eventId) return
    const exerciseIds = (await supabase
      .from('event_exercises').select('id').eq('event_id', eventId)
    ).data?.map((e) => e.id) ?? []
    // .in() avec tableau vide fait planter PostgREST — on court-circuite
    if (exerciseIds.length === 0) { setProgress([]); return }
    const { data } = await supabase
      .from('member_exercise_progress')
      .select('*')
      .eq('member_id', memberId)
      .in('exercise_id', exerciseIds)
    setProgress((data ?? []) as MemberExerciseProgress[])
  }, [memberId, eventId])

  useEffect(() => { refetch() }, [refetch])

  async function setStatus(
    exerciseId: string,
    status: MemberExerciseProgress['status'],
    notes?: string,
  ): Promise<void> {
    if (!memberId) return
    await supabase.from('member_exercise_progress').upsert({
      exercise_id: exerciseId,
      member_id: memberId,
      status,
      notes: notes ?? null,
    }, { onConflict: 'exercise_id,member_id' })
    await refetch()
  }

  async function validate(exerciseId: string, memberId: string, accept: boolean, validatorId: string): Promise<void> {
    const now = new Date().toISOString()
    await supabase.from('member_exercise_progress')
      .update({
        status: accept ? 'validated' : 'refused',
        validated_by: validatorId,
        validated_at: now,
      })
      .eq('exercise_id', exerciseId)
      .eq('member_id', memberId)
    await refetch()
  }

  return { progress, setStatus, validate, refetch }
}

// ─── Messages ─────────────────────────────────────────────────

export function useEventMessages(eventId: string | null) {
  const [messages, setMessages] = useState<EventMessage[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return }
    const { data } = await supabase
      .from('event_messages')
      .select('*, profiles(id, full_name, alias)')
      .eq('event_id', eventId)
      .order('created_at')
    setMessages((data ?? []) as unknown as EventMessage[])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    refetch()
    if (!eventId) return
    const id = setInterval(refetch, 5_000)
    return () => clearInterval(id)
  }, [refetch])

  async function sendMessage(senderId: string, content: string): Promise<void> {
    if (!eventId || !content.trim()) return
    await supabase.from('event_messages').insert({
      event_id: eventId,
      sender_id: senderId,
      content: content.trim(),
    })

    // Récupérer l'événement, les participants et le profil de l'expéditeur en parallèle.
    // get_confirmed_participants() est SECURITY DEFINER : contourne la RLS restrictive
    // sur event_registrations pour les membres non-admin/non-organisateur.
    const [{ data: ev }, { data: participants }, { data: senderProfile }] = await Promise.all([
      supabase.from('events').select('title, date_start').eq('id', eventId).single(),
      supabase.rpc('get_confirmed_participants', { p_event_id: eventId, p_exclude_user: senderId }),
      supabase.from('profiles').select('alias, full_name').eq('id', senderId).single(),
    ])

    if (ev && participants?.length) {
      const sender = displayName(senderProfile)
      const evTyped = ev as unknown as { title: string; date_start?: string }
      const dateStr = evTyped.date_start ? ` (${shortDate(evTyped.date_start)})` : ''
      await Promise.all((participants as unknown as { member_id: string }[]).map((p) =>
        createNotification({
          userId: p.member_id,
          type: 'new_message',
          title: `💬 ${sender} — ${evTyped.title}${dateStr}`,
          body: content.trim().slice(0, 100),
          data: { eventId },
        })
      ))
    }

    await refetch()
  }

  return { messages, loading, sendMessage, refetch }
}

// ─── Événements à venir (dashboard) ──────────────────────────

export function useUpcomingEvents(limit = 3) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('events')
      .select('*, dive_sites(*), event_registrations(*)')
      .gte('date_start', new Date().toISOString())
      .eq('is_cancelled', false)
      .order('date_start')
      .limit(limit)
      .then(({ data }) => {
        setEvents(asEvents(data))
        setLoading(false)
      })
  }, [limit])

  return { events, loading }
}
