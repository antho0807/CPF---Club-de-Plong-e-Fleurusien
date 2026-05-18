import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CATreasury, TreasuryCategory } from '../types/database.types'

export function useCATreasury() {
  const [transactions, setTransactions] = useState<CATreasury[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ca_treasury')
      .select('*, profiles(full_name, alias)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setTransactions((data ?? []) as CATreasury[])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  async function addTransaction(data: {
    amount: number
    category: TreasuryCategory
    description: string
    date: string
    created_by: string
  }): Promise<void> {
    const { error } = await supabase.from('ca_treasury').insert(data)
    if (error) throw error
    await refetch()
  }

  async function deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('ca_treasury').delete().eq('id', id)
    if (error) throw error
    await refetch()
  }

  function exportCSV(): void {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant (€)', 'Ajouté par']
    const rows = transactions.map((t) => {
      const p = t.profiles as { full_name?: string; alias?: string } | undefined
      return [
        t.date,
        t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        Number(t.amount).toFixed(2),
        p?.alias || p?.full_name || '',
      ].join(';')
    })
    const csv = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tresorerie-cpf-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { transactions, balance, loading, refetch, addTransaction, deleteTransaction, exportCSV }
}
