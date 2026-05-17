import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = 'BGTchfDhz9vM8NFqOS97lrmf2kxMIs8D1oEq6nWz-VoVyNIQMMRCeFe4L_h91BO18qDqOQdV4Ki5e7UtKP6Xqck'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications(userId: string | null) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [])

  useEffect(() => {
    if (!userId || !supported) return
    supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setSubscribed(!!data))
  }, [userId, supported])

  async function subscribe() {
    if (!userId || !supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: sub.toJSON() as Record<string, unknown>,
      })
      setSubscribed(true)
    } catch (e) {
      console.error('Push subscribe error:', e)
    }
    setLoading(false)
  }

  async function unsubscribe() {
    if (!userId || !supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      await sub?.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      setSubscribed(false)
    } catch (e) {
      console.error('Push unsubscribe error:', e)
    }
    setLoading(false)
  }

  async function toggle() {
    if (subscribed) {
      await unsubscribe()
    } else {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') await subscribe()
    }
  }

  return { supported, subscribed, loading, toggle }
}
