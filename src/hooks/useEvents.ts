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
    const { error } = await supabase
      .from('events')
      .insert(insertable as TablesInsert<'events'>)
    if (error) throw error
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
  async function registerToEvent(eventId: string, memberId: string): Promise<void> {
    const { error } = await supabase.from('event_registrations').insert({
      event_id: eventId,
      member_id: memberId,
      status: 'pending',
    })
    if (error) throw error

    // Notifier l'organisateur (ou les moniteurs/admins)
    const event = events.find((e) => e.id === eventId)
    if (event?.organizer_id) {
      const member = (event.event_registrations ?? []).find((r) => r.member_id === memberId)
      const memberName = (member?.profiles as { full_name?: string } | undefined)?.full_name ?? 'Un membre'
      await createNotification({
        userId: event.organizer_id,
        type: 'registration_pending',
        title: 'Nouvelle demande d\'inscription',
        body: `${memberName} souhaite s'inscrire à « ${event.title} ».`,
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
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: newStatus })
      .eq('event_id', eventId)
      .eq('member_id', memberId)
    if (error) throw error

    const event = events.find((e) => e.id === eventId)
    const eventTitle = event?.title ?? 'un événement'

    await createNotification({
      userId: memberId,
      type: accept ? 'registration_confirmed' : 'registration_refused',
      title: accept ? 'Inscription confirmée !' : 'Inscription refusée',
      body: accept
        ? `Votre inscription à « ${eventTitle} » a été validée par l'organisateur.`
        : `Votre inscription à « ${eventTitle} » a été refusée.`,
      data: { eventId },
    })

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
    const { data } = await supabase
      .from('member_exercise_progress')
      .select('*')
      .eq('member_id', memberId)
      .in(
        'exercise_id',
        (await supabase.from('event_exercises').select('id').eq('event_id', eventId)).data?.map((e) => e.id) ?? [],
      )
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
      .select('*, profiles(id, full_name)')
      .eq('event_id', eventId)
      .order('created_at')
    setMessages((data ?? []) as unknown as EventMessage[])
    setLoading(false)
  }, [eventId])

  useEffect(() => { refetch() }, [refetch])

  async function sendMessage(senderId: string, content: string): Promise<void> {
    if (!eventId || !content.trim()) return
    await supabase.from('event_messages').insert({
      event_id: eventId,
      sender_id: senderId,
      content: content.trim(),
    })
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
