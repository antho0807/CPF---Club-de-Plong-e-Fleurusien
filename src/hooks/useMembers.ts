import { useCallback, useEffect, useState } from 'react'
import { supabase, SUPABASE_FUNCTIONS_URL } from '../lib/supabase'
import type { TablesUpdate } from '../types/supabase'
import type { Profile } from '../types/database.types'

export function useMembers() {
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (err) {
      setError(err.message)
    } else {
      setMembers((data ?? []) as Profile[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetchMembers()
  }, [refetchMembers])

  // Invitation d'un nouveau membre via l'Edge Function invite-member.
  // L'Edge Function utilise le service role côté serveur pour créer l'auth user.
  // Le trigger SQL handle_new_user() crée ensuite le profil automatiquement.
  async function inviteMember(member: {
    email: string
    full_name: string
    phone?: string | null
    date_naissance?: string | null
    lifras_number?: string | null
    brevet_level?: Profile['brevet_level']
    role?: Profile['role']
    notes?: string | null
  }): Promise<{ error: string | null }> {
    const functionsUrl = SUPABASE_FUNCTIONS_URL
    if (!functionsUrl) {
      return { error: 'VITE_SUPABASE_FUNCTIONS_URL non configuré dans .env' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Non authentifié' }

    try {
      // Utiliser window.fetch pour éviter le conflit de nom avec refetchMembers
      const res = await window.fetch(`${functionsUrl}/invite-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(member),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { error: (body as { error?: string }).error ?? `Erreur HTTP ${res.status}` }
      }

      await refetchMembers()
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erreur réseau' }
    }
  }

  async function updateMember(id: string, updates: Partial<Profile>): Promise<void> {
    const { id: _id, created_at: _c, ...updatable } = updates as Record<string, unknown>
    const { data, error: err } = await supabase
      .from('profiles')
      .update(updatable as TablesUpdate<'profiles'>)
      .eq('id', id)
      .select()
    if (err) throw new Error(err.message)
    if (!data || data.length === 0) throw new Error('Mise à jour refusée — vérifiez la politique RLS profiles UPDATE')
    await refetchMembers()
  }

  async function deactivateMember(id: string): Promise<void> {
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id)
    if (err) throw err
    await refetchMembers()
  }

  async function reactivateMember(id: string): Promise<void> {
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', id)
    if (err) throw err
    await refetchMembers()
  }

  return {
    members,
    loading,
    error,
    refetch: refetchMembers,
    inviteMember,
    createMember: inviteMember, // alias pour compatibilité
    updateMember,
    deactivateMember,
    reactivateMember,
  }
}

export function useMember(id: string | undefined) {
  const [member, setMember] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    setMember(data as Profile | null)
    setLoading(false)
  }, [id])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { member, loading, refetch }
}
