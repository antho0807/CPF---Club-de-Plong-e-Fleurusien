import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { EventType, SiteType } from '../types/database.types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: fr })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy à HH:mm', { locale: fr })
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  entrainement_piscine: 'Entraînement piscine',
  sortie_mer: 'Sortie mer',
  sortie_lac: 'Sortie lac',
  sortie_carriere: 'Sortie carrière',
  formation: 'Formation',
  reunion: 'Réunion',
  competition: 'Compétition',
  autre: 'Autre',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  entrainement_piscine: '#0077b6',
  sortie_mer: '#f4a261',
  sortie_lac: '#e9c46a',
  sortie_carriere: '#e76f51',
  formation: '#2a9d8f',
  reunion: '#6b7280',
  competition: '#7c3aed',
  autre: '#6b7280',
}

export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  piscine: 'Piscine',
  mer: 'Mer',
  lac: 'Lac',
  carriere: 'Carrière',
  fosse: 'Fosse',
}

/**
 * Calcule la date d'expiration d'un certificat médical selon la règle LIFRAS :
 * - Visite entre jan–août → expiration le 31 janvier de l'année suivante
 * - Visite entre sep–déc → expiration le 31 janvier de l'année d'après (N+2)
 */
export function computeMedicalExpiry(certDate: string): string {
  const d = parseISO(certDate)
  const month = d.getMonth() // 0=jan … 11=déc
  const year = d.getFullYear()
  const expiryYear = month <= 7 ? year + 1 : year + 2
  return format(new Date(expiryYear, 0, 31), 'yyyy-MM-dd')
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
