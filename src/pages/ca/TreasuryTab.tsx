import { useState, useMemo } from 'react'
import { Plus, Download, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useCATreasury } from '../../hooks/useCATreasury'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import type { TreasuryCategory } from '../../types/database.types'

const CATEGORY_LABELS: Record<TreasuryCategory, string> = {
  buvette: '🥤 Buvette',
  cotisation: '💳 Cotisation',
  achat_stock: '📦 Achat stock',
  evenement: '📅 Événement',
  autre: '🗂 Autre',
}

const CATEGORY_COLORS: Record<TreasuryCategory, string> = {
  buvette: 'bg-blue-100 text-blue-700',
  cotisation: 'bg-green-100 text-green-700',
  achat_stock: 'bg-orange-100 text-orange-700',
  evenement: 'bg-purple-100 text-purple-700',
  autre: 'bg-gray-100 text-gray-600',
}

export function TreasuryTab() {
  const { profile, isAdmin } = useAuth()
  const { transactions, balance, loading, addTransaction, deleteTransaction, exportCSV } = useCATreasury()
  const [showAdd, setShowAdd] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Form
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'recette' | 'depense'>('recette')
  const [category, setCategory] = useState<TreasuryCategory>('buvette')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const filtered = useMemo(
    () => filterCategory === 'all' ? transactions : transactions.filter((t) => t.category === filterCategory),
    [transactions, filterCategory],
  )

  const recettes = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0)
  const depenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0)

  async function handleAdd() {
    if (!amount || !description.trim()) return
    const finalAmount = type === 'recette' ? Math.abs(parseFloat(amount)) : -Math.abs(parseFloat(amount))
    setAdding(true)
    setAddError(null)
    try {
      await addTransaction({ amount: finalAmount, category, description: description.trim(), date, created_by: profile!.id })
      setShowAdd(false)
      setAmount(''); setDescription(''); setDate(new Date().toISOString().slice(0, 10))
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e))
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Résumé solde */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Solde</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
          </p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-xs text-green-600 mb-1 flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" /> Recettes
          </p>
          <p className="text-xl font-bold text-green-700">+{recettes.toFixed(2)} €</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-xs text-red-600 mb-1 flex items-center justify-center gap-1">
            <TrendingDown className="h-3 w-3" /> Dépenses
          </p>
          <p className="text-xl font-bold text-red-600">{depenses.toFixed(2)} €</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 text-sm h-9">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {(Object.entries(CATEGORY_LABELS) as [TreasuryCategory, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Liste des transactions */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucune transaction. Commencez par en enregistrer une.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((t) => {
            const p = t.profiles as { full_name?: string; alias?: string } | undefined
            const isRecette = t.amount > 0
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{t.description}</p>
                    <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[t.category]}`}>
                      {CATEGORY_LABELS[t.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(t.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {p && <span className="ml-2">· {p.alias || p.full_name}</span>}
                  </p>
                </div>
                <span className={`text-base font-bold tabular-nums flex-shrink-0 ${isRecette ? 'text-green-700' : 'text-red-600'}`}>
                  {isRecette ? '+' : ''}{Number(t.amount).toFixed(2)} €
                </span>
                {(isAdmin || t.created_by === profile?.id) && (
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog ajouter transaction */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle transaction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Recette / Dépense */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === 'recette' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setType('recette')}
              >
                + Recette
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === 'depense' ? 'bg-red-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setType('depense')}
              >
                − Dépense
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Montant (€) *</Label>
                <Input className="mt-1" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Date *</Label>
                <Input className="mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TreasuryCategory)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [TreasuryCategory, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description *</Label>
              <Input className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Ventes buvette soirée du 15/05" />
            </div>

            {addError && <p className="text-sm text-red-600">{addError}</p>}

            <div className="flex gap-3 pt-1">
              <Button onClick={handleAdd} disabled={adding || !amount || !description.trim()}>
                {adding ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
