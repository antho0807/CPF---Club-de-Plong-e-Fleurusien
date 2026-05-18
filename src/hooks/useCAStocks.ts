import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CAStockProduct, CAStockMovement, StockCategory, StockReason } from '../types/database.types'

export function useCAStocks() {
  const [products, setProducts] = useState<CAStockProduct[]>([])
  const [movements, setMovements] = useState<CAStockMovement[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from('ca_stock_products').select('*').order('category').order('name'),
      supabase.from('ca_stock_movements')
        .select('*, ca_stock_products(name, unit), profiles(full_name, alias)')
        .order('created_at', { ascending: false })
        .limit(100),
    ])
    setProducts((prods ?? []) as CAStockProduct[])
    // Cast via unknown : les relations FK existent en base mais ne sont pas déclarées
    // dans supabase.ts → TypeScript voit SelectQueryError, le runtime retourne bien les données
    setMovements((movs ?? []) as unknown as CAStockMovement[])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  async function addProduct(data: {
    name: string
    category: StockCategory
    price: number
    quantity_current: number
    quantity_threshold: number
    unit: string
  }): Promise<void> {
    const { error } = await supabase.from('ca_stock_products').insert(data)
    if (error) throw error
    await refetch()
  }

  async function updateProduct(id: string, updates: Partial<CAStockProduct>): Promise<void> {
    // Exclure les champs auto-gérés non acceptés par le type Update
    const { id: _id, created_at: _c, ...updatable } = updates as Record<string, unknown>
    const { error } = await supabase.from('ca_stock_products').update(updatable).eq('id', id)
    if (error) throw error
    await refetch()
  }

  async function addMovement(data: {
    product_id: string
    quantity_change: number
    reason: StockReason
    note: string
    created_by: string
  }): Promise<void> {
    const { error: movErr } = await supabase.from('ca_stock_movements').insert(data)
    if (movErr) throw movErr

    const product = products.find((p) => p.id === data.product_id)
    if (product) {
      const newQty = product.quantity_current + data.quantity_change
      const { error: updErr } = await supabase
        .from('ca_stock_products')
        .update({ quantity_current: newQty })
        .eq('id', data.product_id)
      if (updErr) throw updErr
    }

    await refetch()
  }

  async function archiveProduct(id: string): Promise<void> {
    const { error } = await supabase.from('ca_stock_products').update({ is_active: false }).eq('id', id)
    if (error) throw error
    await refetch()
  }

  return { products, movements, loading, refetch, addProduct, updateProduct, addMovement, archiveProduct }
}
