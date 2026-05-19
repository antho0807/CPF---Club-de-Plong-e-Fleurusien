import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { canCreateAnyEvent } from '../lib/compliance'
import type { Profile } from '../types/database.types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    // 3 tentatives avec délai croissant avant d'abandonner
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 800))
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (!error && data) {
          setProfile(data as Profile | null)
          setLoading(false)
          return
        }
        console.warn(`[fetchProfile] tentative ${attempt + 1}/3 — code: ${error?.code} ${error?.message}`)
      } catch (e) {
        console.warn(`[fetchProfile] tentative ${attempt + 1}/3 — exception`, e)
      }
    }
    // Après 3 échecs : loading false, profile reste null → ProtectedRoute gère
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false)) // Filet de sécurité si getSession échoue

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Intercepte PASSWORD_RECOVERY avant tout pour éviter la redirection vers le dashboard
      if (_event === 'PASSWORD_RECOVERY') {
        setUser(session?.user ?? null) // nécessaire pour que updateUser fonctionne
        setLoading(false)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('reset-password')) {
          window.location.replace('/reset-password')
        }
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp(email: string, password: string, fullName: string) {
    // Le trigger handle_new_user() crée le profil automatiquement côté SQL.
    // On ne fait PAS d'insert manuel ici pour éviter le doublon (409).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // À appeler après une mise à jour du profil pour rafraîchir le contexte
  async function refreshProfile() {
    if (!user?.id) return
    await fetchProfile(user.id)
  }

  const isAdmin = profile?.role === 'admin'
  // Moniteur = brevet LIFRAS, pas un rôle. Compatibilité avec l'ancien rôle + brevet.
  const isMoniteur = isAdmin
    || profile?.role === 'moniteur' // rétrocompatibilité
    || ['moniteur_club', 'moniteur_federal', 'instructeur'].includes(profile?.brevet_level ?? '')
  const isExterne = profile?.role === 'externe'
  const isMembre = !!profile
  const isApproved = profile?.status === 'approved'
  const isPending = profile?.status === 'pending'
  const isRejected = profile?.status === 'rejected'
  const isCA = profile?.is_ca === true || isAdmin
  // Peut créer des événements : admin/moniteur OU brevet P3★+
  const canCreateEvents = profile ? canCreateAnyEvent(profile.role, profile.brevet_level) : false

  return {
    user,
    profile,
    loading,
    isAdmin,
    isMoniteur,
    isExterne,
    isMembre,
    isApproved,
    isPending,
    isRejected,
    isCA,
    canCreateEvents,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }
}
