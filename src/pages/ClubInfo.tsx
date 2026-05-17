import { useState, useEffect } from 'react'
import { ExternalLink, Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import type { CAMember } from '../types/database.types'

const CA_ROLES = [
  'Président', 'Vice-Président', 'Secrétaire', 'Trésorier',
  'Chef-Moniteur', 'Moniteur Fédéral', 'Instructeur',
  'Responsable Matériel', 'Boutique LIFRAS', 'Responsable Événements',
  'Webmaster', 'Membre CA',
]

function CAForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<CAMember>
  onSubmit: (data: Partial<CAMember>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.full_name ?? '')
  const [role, setRole] = useState(initial?.role ?? CA_ROLES[0])
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ full_name: name, role, email: email || null, phone: phone || null })
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Nom complet</Label>
        <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>Fonction</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CA_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Téléphone</Label>
        <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  )
}

export function ClubInfo() {
  const { isAdmin } = useAuth()
  const [caMembers, setCaMembers] = useState<CAMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editMember, setEditMember] = useState<CAMember | null>(null)

  async function fetchCA() {
    const { data } = await supabase.from('ca_members').select('*').order('order_index')
    setCaMembers((data ?? []) as CAMember[])
    setLoading(false)
  }

  useEffect(() => { fetchCA() }, [])

  async function createCA(data: Partial<CAMember>) {
    await supabase.from('ca_members').insert({
      full_name: data.full_name ?? '',
      role: data.role ?? '',
      email: data.email ?? null,
      phone: data.phone ?? null,
      order_index: caMembers.length,
    })
    await fetchCA()
    setShowForm(false)
  }

  async function updateCA(data: Partial<CAMember>) {
    if (!editMember) return
    const { id: _id, ...updatable } = data
    await supabase.from('ca_members').update(updatable).eq('id', editMember.id)
    await fetchCA()
    setEditMember(null)
  }

  async function deleteCA(id: string) {
    if (!confirm('Supprimer ce membre du CA ?')) return
    await supabase.from('ca_members').delete().eq('id', id)
    await fetchCA()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Le Club</h1>
        <p className="text-sm text-gray-500 mt-0.5">CPF — Club de Plongée Fleurusien</p>
      </div>

      {/* Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fiche identité du club</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo + présentation */}
          <div className="flex items-center gap-4 pb-2">
            <img src="/logo-cpf.png" alt="Logo CPF" className="w-20 h-20 object-contain flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Club de Plongée Fleurusien</p>
              <p className="text-sm text-gray-500">ASBL fondée en 1984 · ~50 membres</p>
              <p className="text-sm text-gray-500 mt-1">
                Un club familial affilié à la LIFRAS et à la CMAS, basé à Fleurus (Hainaut, Belgique).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Siège social</p>
              <p className="text-gray-900">Rue du Rabiseau, 6</p>
              <p className="text-gray-500 text-xs">6220 Fleurus, Belgique</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Lieu d'entraînement</p>
              <p className="text-gray-900">Piscine de Fleurus</p>
              <p className="text-gray-500 text-xs">Rue de Fleurjoux, 50 – 6220 Fleurus</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Horaires d'entraînement</p>
              <p className="text-gray-900 font-medium">Mardi 20h00 – 21h30</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Fédération</p>
              <p className="text-gray-900 font-medium">LIFRAS asbl · Club n° 202</p>
              <p className="text-gray-500 text-xs">CMAS Belgium</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Contact</p>
              <a href="mailto:info@cpfleurusien.be" className="text-[#0077b6] hover:underline">
                info@cpfleurusien.be
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Site officiel</p>
              <a
                href="https://www.cpfleurusien.be"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0077b6] flex items-center gap-1 hover:underline"
              >
                www.cpfleurusien.be <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Numéro BCE</p>
              <p className="text-gray-900">BE 0429.763.052</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">IBAN (ING)</p>
              <p className="text-gray-900 font-mono text-xs">BE19 3631 0410 7312</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Affiliations</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">LIFRAS</Badge>
                <Badge variant="outline">CMAS Belgium</Badge>
                <Badge variant="outline">ADEPS (Wallonie)</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">Règles médicales LIFRAS (en vigueur)</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>NB et P1★ : formulaire CACI auto-déclaratif accepté (depuis janv. 2024)</li>
              <li>P2★ et supérieur : attestation médicale obligatoire chez un médecin</li>
              <li>Visite entre janv. et août → certificat valable jusqu'au 31/01 de l'année suivante</li>
              <li>Visite entre sept. et déc. → certificat valable jusqu'au 31/01 de l'année N+2</li>
              <li>Après tout accident de plongée : reprise interdite sans nouvel examen médical</li>
              <li>Cotisation annuelle à jour obligatoire pour plonger</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Conseil d'Administration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Conseil d'Administration</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}
            </div>
          ) : caMembers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aucun membre du CA enregistré.</p>
          ) : (
            <div className="divide-y">
              {caMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{m.full_name}</p>
                      <Badge variant="secondary" className="text-xs">{m.role}</Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      {m.email && <span>{m.email}</span>}
                      {m.phone && <span>{m.phone}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMember(m)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => deleteCA(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Centre hyperbare */}
      <Card>
        <CardContent className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900">
            <p className="font-bold mb-2">🚨 Urgence hyperbare — Centre de référence</p>
            <p className="font-semibold">CHU de Liège — Service de médecine hyperbare</p>
            <p>Tél : +32 4 366 71 11</p>
            <p className="font-bold mt-2">SECOURS : 112</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un membre CA</DialogTitle></DialogHeader>
          <CAForm onSubmit={createCA} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le membre CA</DialogTitle></DialogHeader>
          {editMember && (
            <CAForm initial={editMember} onSubmit={updateCA} onCancel={() => setEditMember(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
