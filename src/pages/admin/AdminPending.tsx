import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, UserCheck, UserX, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { Profile } from '../../types/database.types'

type PendingProfile = Pick<Profile, 'id' | 'full_name' | 'email' | 'created_at'>

export function AdminPending() {
  const [pending, setPending] = useState<PendingProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('status', 'pending')
      .order('created_at')
      .then(({ data }) => {
        setPending((data ?? []) as PendingProfile[])
        setLoading(false)
      })
  }, [])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setActing(id)
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)
    if (!error) {
      setPending(prev => prev.filter(p => p.id !== id))
    }
    setActing(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Comptes en attente</h1>
            <p className="text-sm text-gray-500">Approuver ou refuser les nouvelles inscriptions</p>
          </div>
        </div>

        {/* Compteur */}
        {!loading && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>
              {pending.length === 0
                ? 'Aucun compte en attente'
                : `${pending.length} compte${pending.length > 1 ? 's' : ''} en attente`}
            </span>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
          </div>
        ) : pending.length === 0 ? (
          <Card className="p-10 text-center text-gray-400">
            <UserCheck className="h-10 w-10 mx-auto mb-3 text-green-400" />
            <p className="font-medium text-gray-600">Tout est à jour</p>
            <p className="text-sm mt-1">Aucune inscription en attente de validation.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map(p => (
              <Card key={p.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">{p.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Inscrit le {new Date(p.created_at).toLocaleDateString('fr-BE', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(p.id, 'approved')}
                      disabled={acting === p.id}
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    >
                      <UserCheck className="h-4 w-4" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(p.id, 'rejected')}
                      disabled={acting === p.id}
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                    >
                      <UserX className="h-4 w-4" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
