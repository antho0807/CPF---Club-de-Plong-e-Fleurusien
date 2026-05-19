import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, UserCheck, UserX, Clock, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { Profile, UserRole } from '../../types/database.types'

type PendingProfile = Pick<Profile, 'id' | 'full_name' | 'email' | 'created_at'>

const ROLE_OPTIONS: { value: UserRole; label: string; description: string; color: string }[] = [
  {
    value: 'externe',
    label: 'Membre externe',
    description: 'Accès calendrier uniquement — peut s\'inscrire aux événements',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  {
    value: 'membre',
    label: 'Membre effectif',
    description: 'Accès complet — objectifs, documents, événements…',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    value: 'admin',
    label: 'Administrateur',
    description: 'Accès total — gestion des membres, CA, approbations',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
]

export function AdminPending() {
  const [pending, setPending] = useState<PendingProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  // id du membre dont le panneau de rôle est ouvert
  const [choosingRole, setChoosingRole] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({})

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

  async function approve(id: string) {
    const role = selectedRoles[id] ?? 'membre'
    setActing(id)
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved', role })
      .eq('id', id)
    if (!error) {
      setPending(prev => prev.filter(p => p.id !== id))
      setChoosingRole(null)
    }
    setActing(null)
  }

  async function reject(id: string) {
    setActing(id)
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'rejected' })
      .eq('id', id)
    if (!error) setPending(prev => prev.filter(p => p.id !== id))
    setActing(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Comptes en attente</h1>
            <p className="text-sm text-gray-500">Approuver, choisir le rôle, ou refuser</p>
          </div>
        </div>

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
            {pending.map(p => {
              const isOpen = choosingRole === p.id
              const currentRole = selectedRoles[p.id] ?? 'membre'
              const roleOption = ROLE_OPTIONS.find(r => r.value === currentRole)!

              return (
                <Card key={p.id} className="overflow-hidden">
                  {/* Info membre */}
                  <div className="flex items-center gap-4 p-4">
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
                        onClick={() => setChoosingRole(isOpen ? null : p.id)}
                        disabled={acting === p.id}
                        className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      >
                        <UserCheck className="h-4 w-4" />
                        Approuver
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reject(p.id)}
                        disabled={acting === p.id}
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                      >
                        <UserX className="h-4 w-4" />
                        Refuser
                      </Button>
                    </div>
                  </div>

                  {/* Panneau de sélection du rôle */}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Choisissez le rôle pour {p.full_name.split(' ')[0]}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ROLE_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedRoles(prev => ({ ...prev, [p.id]: option.value }))}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${
                              currentRole === option.value
                                ? `${option.color} border-current`
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{option.description}</p>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => approve(p.id)}
                          disabled={acting === p.id}
                          className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                        >
                          <UserCheck className="h-4 w-4" />
                          {acting === p.id ? 'Validation…' : `Confirmer — ${roleOption.label}`}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setChoosingRole(null)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
