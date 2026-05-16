import { useState, useEffect, useCallback } from 'react'
import { MapPin, Plus, Waves, Eye, Edit2, Anchor } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BREVET_LABELS } from '../lib/compliance'
import { SITE_TYPE_LABELS } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { SiteForm } from '../components/sites/SiteForm'
import type { DiveSite } from '../types/database.types'

const SITE_ICONS: Record<string, typeof Waves> = {
  mer: Waves, lac: Waves, carriere: Anchor, piscine: Anchor, fosse: Anchor,
}

function SiteCard({ site, onEdit }: { site: DiveSite; onEdit: (s: DiveSite) => void }) {
  const [showDetails, setShowDetails] = useState(false)
  const Icon = SITE_ICONS[site.site_type] ?? MapPin

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="bg-[#0077b6]/10 p-2 rounded-lg flex-shrink-0">
                <Icon className="h-5 w-5 text-[#0077b6]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{site.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{SITE_TYPE_LABELS[site.site_type]}</Badge>
                  {site.min_brevet && (
                    <Badge variant="outline" className="text-xs">{BREVET_LABELS[site.min_brevet]}</Badge>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  {site.max_depth && <span>↓ {site.max_depth}m max</span>}
                  {site.visibility_avg && <span>👁 {site.visibility_avg}m visibilité moy.</span>}
                </div>
                {site.address && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{site.address}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDetails(true)}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#0077b6]" />
              {site.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{SITE_TYPE_LABELS[site.site_type]}</Badge>
              {site.min_brevet && <Badge variant="outline">{BREVET_LABELS[site.min_brevet]}</Badge>}
              <Badge variant="outline">{site.country}</Badge>
            </div>

            {site.description && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Description</p>
                <p className="text-gray-600">{site.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {site.max_depth && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-semibold">Profondeur max</p>
                  <p className="text-lg font-bold text-blue-900">{site.max_depth}m</p>
                </div>
              )}
              {site.visibility_avg && (
                <div className="bg-teal-50 rounded-lg p-3">
                  <p className="text-xs text-teal-600 font-semibold">Visibilité moy.</p>
                  <p className="text-lg font-bold text-teal-900">{site.visibility_avg}m</p>
                </div>
              )}
            </div>

            {site.address && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Adresse</p>
                <p className="text-gray-600">{site.address}</p>
                {site.gps_lat && site.gps_lng && (
                  <a
                    href={`https://www.google.com/maps?q=${site.gps_lat},${site.gps_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0077b6] text-xs hover:underline mt-1 inline-block"
                  >
                    Ouvrir dans Google Maps →
                  </a>
                )}
              </div>
            )}

            {site.access_instructions && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Accès</p>
                <p className="text-gray-600 whitespace-pre-line">{site.access_instructions}</p>
              </div>
            )}

            {site.facilities && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Équipements</p>
                <p className="text-gray-600">{site.facilities}</p>
              </div>
            )}

            {site.safety_rules && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="font-semibold text-orange-900 mb-2">Règles de sécurité LIFRAS</p>
                <p className="text-orange-800 whitespace-pre-line text-xs">{site.safety_rules}</p>
              </div>
            )}

            {site.emergency_contacts && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-semibold text-red-900 mb-2">Contacts d'urgence</p>
                <p className="text-red-800 whitespace-pre-line text-xs">{site.emergency_contacts}</p>
              </div>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={() => { setShowDetails(false); onEdit(site) }}>
              <Edit2 className="h-4 w-4" /> Modifier ce site
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DiveSites() {
  const { isMoniteur, profile } = useAuth()
  const [sites, setSites] = useState<DiveSite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSite, setEditSite] = useState<DiveSite | null>(null)

  const fetchSites = useCallback(async () => {
    const { data } = await supabase.from('dive_sites').select('*').order('name')
    setSites((data ?? []) as DiveSite[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSites() }, [fetchSites])

  async function handleCreate(data: Partial<DiveSite>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('dive_sites') as any).insert(data)
    await fetchSites()
    setShowForm(false)
  }

  async function handleUpdate(data: Partial<DiveSite>) {
    if (!editSite) return
    const { id: _id, created_at: _c, created_by: _cb, ...updatable } = data as Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('dive_sites') as any).update(updatable).eq('id', editSite.id)
    await fetchSites()
    setEditSite(null)
  }

  const byType = sites.reduce((acc, s) => {
    acc[s.site_type] = acc[s.site_type] ?? []
    acc[s.site_type].push(s)
    return acc
  }, {} as Record<string, DiveSite[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites de plongée</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sites.length} sites enregistrés</p>
        </div>
        {isMoniteur && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un site
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : sites.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Aucun site de plongée enregistré.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(byType).map(([type, typeSites]) => (
            <div key={type}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {SITE_TYPE_LABELS[type as keyof typeof SITE_TYPE_LABELS]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {typeSites.map((s) => (
                  <SiteCard key={s.id} site={s} onEdit={setEditSite} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un site de plongée</DialogTitle>
          </DialogHeader>
          <SiteForm
            createdBy={profile?.id ?? ''}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editSite} onOpenChange={(open) => !open && setEditSite(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le site</DialogTitle>
          </DialogHeader>
          {editSite && (
            <SiteForm
              initial={editSite}
              createdBy={profile?.id ?? ''}
              onSubmit={handleUpdate}
              onCancel={() => setEditSite(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
