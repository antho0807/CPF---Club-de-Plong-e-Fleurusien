import { useState } from 'react'
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, Archive } from 'lucide-react'
import { useCAStocks } from '../../hooks/useCAStocks'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import type { CAStockProduct, StockCategory, StockReason } from '../../types/database.types'

const CATEGORY_LABELS: Record<StockCategory, string> = {
  boisson: '🥤 Boissons',
  snack: '🍫 Snacks',
  autre: '📦 Autre',
}

const REASON_LABELS: Record<StockReason, string> = {
  achat: 'Achat / réapprovisionnement',
  vente: 'Vente',
  perte: 'Perte / casse',
  ajustement: 'Ajustement inventaire',
}

export function StocksTab() {
  const { profile } = useAuth()
  const { products, movements, loading, addProduct, addMovement, archiveProduct } = useCAStocks()
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [movementProduct, setMovementProduct] = useState<CAStockProduct | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Form: nouveau produit
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<StockCategory>('boisson')
  const [newPrice, setNewPrice] = useState('')
  const [newQty, setNewQty] = useState('0')
  const [newThreshold, setNewThreshold] = useState('5')
  const [newUnit, setNewUnit] = useState('unité')
  const [addingProduct, setAddingProduct] = useState(false)

  // Form: mouvement
  const [movQty, setMovQty] = useState('1')
  const [movReason, setMovReason] = useState<StockReason>('vente')
  const [movNote, setMovNote] = useState('')
  const [addingMov, setAddingMov] = useState(false)
  const [movError, setMovError] = useState<string | null>(null)

  const activeProducts = products.filter((p) => p.is_active)
  const filtered = filterCategory === 'all' ? activeProducts : activeProducts.filter((p) => p.category === filterCategory)
  const lowStock = activeProducts.filter((p) => p.quantity_current <= p.quantity_threshold)

  async function handleAddProduct() {
    if (!newName.trim()) return
    setAddingProduct(true)
    try {
      await addProduct({
        name: newName.trim(),
        category: newCategory,
        price: parseFloat(newPrice) || 0,
        quantity_current: parseInt(newQty) || 0,
        quantity_threshold: parseInt(newThreshold) || 5,
        unit: newUnit.trim() || 'unité',
      })
      setShowAddProduct(false)
      setNewName(''); setNewPrice(''); setNewQty('0'); setNewThreshold('5'); setNewUnit('unité')
    } catch (e) {
      alert('Erreur : ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setAddingProduct(false)
    }
  }

  async function handleAddMovement() {
    if (!movementProduct || !movQty) return
    const qty = movReason === 'vente' || movReason === 'perte'
      ? -Math.abs(parseInt(movQty))
      : Math.abs(parseInt(movQty))
    setAddingMov(true)
    setMovError(null)
    try {
      await addMovement({
        product_id: movementProduct.id,
        quantity_change: qty,
        reason: movReason,
        note: movNote.trim(),
        created_by: profile!.id,
      })
      setMovementProduct(null)
      setMovQty('1'); setMovReason('vente'); setMovNote('')
    } catch (e) {
      setMovError(e instanceof Error ? e.message : String(e))
    } finally {
      setAddingMov(false)
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
      {/* Alertes stock faible */}
      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-orange-800">{lowStock.length} produit(s) en stock faible</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span key={p.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {p.name} — {p.quantity_current} {p.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* En-tête + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 text-sm h-9">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {(Object.entries(CATEGORY_LABELS) as [StockCategory, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowAddProduct(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Button>
      </div>

      {/* Liste des produits */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun produit. Commencez par en ajouter un.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((product) => {
            const isLow = product.quantity_current <= product.quantity_threshold
            return (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-400">{CATEGORY_LABELS[product.category]}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {Number(product.price).toFixed(2)} €
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 ${isLow ? 'text-orange-600' : 'text-green-700'}`}>
                    {isLow && <AlertTriangle className="h-4 w-4" />}
                    <span className="text-2xl font-bold">{product.quantity_current}</span>
                    <span className="text-xs text-gray-400">{product.unit}</span>
                  </div>
                  <p className="text-xs text-gray-400">seuil : {product.quantity_threshold}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-green-700 border-green-200 hover:bg-green-50 text-xs"
                    onClick={() => { setMovementProduct(product); setMovReason('achat') }}
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> Entrée
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                    onClick={() => { setMovementProduct(product); setMovReason('vente') }}
                  >
                    <TrendingDown className="h-3.5 w-3.5" /> Sortie
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 text-gray-400 hover:text-gray-600"
                    onClick={() => archiveProduct(product.id)}
                    title="Archiver"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Derniers mouvements */}
      {movements.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Derniers mouvements</p>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {movements.slice(0, 10).map((m) => {
              const prod = m.ca_stock_products as { name?: string; unit?: string } | undefined
              const p = m.profiles as { full_name?: string; alias?: string } | undefined
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`font-semibold tabular-nums ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.quantity_change > 0 ? '+' : ''}{m.quantity_change} {prod?.unit}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800">{prod?.name}</span>
                    <span className="text-gray-400 mx-1.5">·</span>
                    <span className="text-gray-400 text-xs">{REASON_LABELS[m.reason]}</span>
                    {m.note && <span className="text-gray-400 text-xs ml-1.5">— {m.note}</span>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{p?.alias || p?.full_name || ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dialog ajouter produit */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau produit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom *</Label>
              <Input className="mt-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Coca-Cola 33cl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Catégorie</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as StockCategory)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_LABELS) as [StockCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prix unitaire (€)</Label>
                <Input className="mt-1" type="number" min="0" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="1.50" />
              </div>
              <div>
                <Label>Quantité initiale</Label>
                <Input className="mt-1" type="number" min="0" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
              </div>
              <div>
                <Label>Seuil d'alerte</Label>
                <Input className="mt-1" type="number" min="0" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Unité</Label>
              <Input className="mt-1" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="unité, pack, kg…" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={handleAddProduct} disabled={addingProduct || !newName.trim()}>
                {addingProduct ? 'Ajout…' : 'Ajouter'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddProduct(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog mouvement stock */}
      <Dialog open={!!movementProduct} onOpenChange={(open) => { if (!open) setMovementProduct(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {movReason === 'vente' || movReason === 'perte' ? 'Sortie de stock' : 'Entrée de stock'}
            </DialogTitle>
          </DialogHeader>
          {movementProduct && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Produit : <strong>{movementProduct.name}</strong> (stock actuel : {movementProduct.quantity_current} {movementProduct.unit})</p>
              <div>
                <Label>Type de mouvement</Label>
                <Select value={movReason} onValueChange={(v) => setMovReason(v as StockReason)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(REASON_LABELS) as [StockReason, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantité</Label>
                <Input className="mt-1" type="number" min="1" value={movQty} onChange={(e) => setMovQty(e.target.value)} />
              </div>
              <div>
                <Label>Note <span className="text-gray-400 text-xs">(optionnel)</span></Label>
                <Input className="mt-1" value={movNote} onChange={(e) => setMovNote(e.target.value)} placeholder="Ex: soirée du 15 mai" />
              </div>
              {movError && <p className="text-sm text-red-600">{movError}</p>}
              <div className="flex gap-3 pt-1">
                <Button onClick={handleAddMovement} disabled={addingMov || !movQty}>
                  {addingMov ? 'Enregistrement…' : 'Confirmer'}
                </Button>
                <Button variant="outline" onClick={() => setMovementProduct(null)}>Annuler</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
