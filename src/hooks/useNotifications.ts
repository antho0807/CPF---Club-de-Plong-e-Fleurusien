import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Notification } from '../types/database.types'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetch = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifications((data ?? []) as Notification[])
  }, [userId])

  useEffect(() => {
    fetch()
    // Polling toutes les 30s (pas de WebSocket en mode simple)
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [fetch])

  async function markRead(id: string) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    )
  }

  async function markAllRead() {
    if (!userId) return
    const now = new Date().toISOString()
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null)
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetch }
}

/** Crée une notification en base (appelée depuis useEvents) */
export async function createNotification(params: {
  userId: string
  type: Notification['type']
  title: string
  body: string
  data?: Record<string, unknown>
}): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data ?? {},
  })
}
