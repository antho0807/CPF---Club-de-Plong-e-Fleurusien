/**
 * Edge Function — Synchronise les événements publics LIFRAS
 * Déploiement : supabase functions deploy fetch-lifras-events
 * Appelée manuellement depuis le dashboard admin ou via cron.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LIFRAS_URLS = [
  'https://www.lifras.be/page3.asp?PageGroupeID=1',
  'https://www.lifras.be/page3.asp?PageGroupeID=155',
]

interface ExternalEvent {
  title: string
  content: string | null
  url: string | null
  source: string
  event_date: string | null
  location: string | null
}

async function scrapeLifras(url: string): Promise<ExternalEvent[]> {
  const events: ExternalEvent[] = []
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CPF-Plongee-Bot/1.0 (info@cpfleurusien.be)' },
    })
    if (!res.ok) return events
    const html = await res.text()

    // Extraction basique : chercher des blocs avec date et titre
    // Pattern LIFRAS : <td class="liste_..."> ou balises de titre
    const titlePattern = /<(?:td|div|h\d)[^>]*class="[^"]*(?:titre|title|event|activit)[^"]*"[^>]*>([^<]{5,200})<\/(?:td|div|h\d)>/gi
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g

    let match
    while ((match = titlePattern.exec(html)) !== null) {
      const title = match[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
      if (title.length < 5) continue

      // Chercher une date proche dans le texte environnant
      const context = html.slice(Math.max(0, match.index - 500), match.index + 500)
      const dateMatch = datePattern.exec(context)
      let event_date: string | null = null
      if (dateMatch) {
        const [, d, m, y] = dateMatch
        const year = y.length === 2 ? `20${y}` : y
        event_date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        datePattern.lastIndex = 0
      }

      events.push({ title, content: null, url, source: 'LIFRAS', event_date, location: null })
    }
  } catch (e) {
    console.error('Scraping error:', e)
  }
  return events
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Accepter aussi des événements manuels envoyés dans le body
  let manualEvent: ExternalEvent | null = null
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      if (body.title) manualEvent = body as ExternalEvent
    } catch { /* ignore */ }
  }

  const scraped: ExternalEvent[] = []

  if (!manualEvent) {
    for (const url of LIFRAS_URLS) {
      const events = await scrapeLifras(url)
      scraped.push(...events)
    }
  } else {
    scraped.push(manualEvent)
  }

  let inserted = 0
  let errors: string[] = []

  for (const ev of scraped.slice(0, 20)) {
    const { error } = await supabase.from('external_events').upsert({
      title: ev.title.slice(0, 200),
      content: ev.content,
      url: ev.url,
      source: ev.source ?? 'LIFRAS',
      event_date: ev.event_date,
      location: ev.location,
      active: true,
    }, { onConflict: 'title,event_date' } as Record<string, unknown>)

    if (error) errors.push(error.message)
    else inserted++
  }

  return new Response(
    JSON.stringify({ inserted, total: scraped.length, errors: errors.length ? errors : undefined }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
