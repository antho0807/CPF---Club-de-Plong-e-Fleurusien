import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface NotificationPreferences {
  id: string
  user_id: string
  new_event: boolean
  event_reminder: boolean
  registration_update: boolean
  new_message: boolean
  account_approved: boolean
  medical_expiry: boolean
  club_announcement: boolean
  updated_at: string
}

export type NotifPrefKey = keyof Omit<NotificationPreferences, 'id' | 'user_id' | 'updated_at'>

export const NOTIF_PREF_LABELS: Record<NotifPrefKey, string> = {
  new_event: '🆕 Nouvel événement créé',
  event_reminder: '📅 Rappel 24h avant un événement inscrit',
  registration_update: '✅ Inscription approuvée / refusée',
  new_message: '💬 Nouveau message sur un événement',
  account_approved: '👤 Compte approuvé (admin)',
  medical_expiry: '⚠️ Certificat médical expirant dans 30 jours',
  club_announcement: '📢 Annonce / actualité du club',
}

const DEFAULT_PREFS: Omit<NotificationPreferences, 'id' | 'user_id' | 'updated_at'> = {
  new_event: true,
  event_reminder: true,
  registration_update: true,
  new_message: true,
  account_approved: true,
  medical_expiry: true,
  club_announcement: true,
}

export function useNotificationPreferences(userId: string | undefined) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refetch = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    setPrefs(data as NotificationPreferences | null)
    setLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  async function updatePref(key: NotifPrefKey, value: boolean) {
    if (!userId) return
    setSaving(true)
    const payload = {
      user_id: userId,
      ...(prefs ? {} : DEFAULT_PREFS),
      [key]: value,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()
    if (!error) setPrefs(data as NotificationPreferences)
    setSaving(false)
  }

  async function updateAllPrefs(value: boolean) {
    if (!userId) return
    setSaving(true)
    const payload = {
      user_id: userId,
      new_event: value, event_reminder: value, registration_update: value,
      new_message: value, account_approved: value, medical_expiry: value,
      club_announcement: value,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select().single()
    if (!error) setPrefs(data as NotificationPreferences)
    setSaving(false)
  }

  // Retourne les préférences effectives (avec les défauts si aucune ligne n'existe)
  const effectivePrefs = prefs ?? { ...DEFAULT_PREFS, id: '', user_id: userId ?? '', updated_at: '' }

  return { prefs: effectivePrefs, loading, saving, updatePref, updateAllPrefs }
}
