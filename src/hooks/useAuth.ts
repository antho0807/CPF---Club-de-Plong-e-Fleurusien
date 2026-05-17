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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[fetchProfile] erreur Supabase:', error.code, error.message)
        // PGRST116 = aucun résultat → trigger peut être lent, on retente une fois
        if (error.code === 'PGRST116') {
          await new Promise((r) => setTimeout(r, 800))
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          if (retryError) console.error('[fetchProfile] retry erreur:', retryError.code, retryError.message)
          setProfile((retryData ?? null) as Profile | null)
        }
      } else {
        setProfile(data as Profile | null)
      }
    } catch {
      // Erreur réseau imprévue — profile reste null
    } finally {
      setLoading(false)
    }
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
  const isMoniteur = profile?.role === 'moniteur' || isAdmin
  const isMembre = !!profile
  const isApproved = profile?.status === 'approved'
  const isPending = profile?.status === 'pending'
  const isRejected = profile?.status === 'rejected'
  // Peut créer des événements : admin/moniteur OU brevet P3★+
  const canCreateEvents = profile ? canCreateAnyEvent(profile.role, profile.brevet_level) : false

  return {
    user,
    profile,
    loading,
    isAdmin,
    isMoniteur,
    isMembre,
    isApproved,
    isPending,
    isRejected,
    canCreateEvents,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }
}
