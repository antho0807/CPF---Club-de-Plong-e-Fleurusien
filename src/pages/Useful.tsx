import { ExternalLink, BookOpen, Store, Shield, Phone, Globe, Clock, MapPin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

// ─── Données magasins ───────────────────────────────────────────────────────

const SHOPS = [
  {
    name: 'Xperience Diving',
    address: 'Rue du Marais 48, 6150 Anderlues',
    phone: '+32 492 37 21 45',
    email: 'contact.xperiencediving@gmail.com',
    website: 'https://www.xperiencediving.be',
    distance: '~15 km de Charleroi',
    services: ['Vente matériel', 'Combinaisons étanches', 'Gonflage air & nitrox', 'Réparation', 'Formation plongée technique'],
    hours: '[À VÉRIFIER sur le site]',
  },
  {
    name: 'Nérée Diving – Namur',
    address: 'Rue Père Cambier 17, 5000 Namur',
    phone: '+32 81 74 03 07',
    email: null,
    website: 'https://www.neree-diving.com',
    distance: '~40 km de Charleroi',
    services: ['Vente matériel', 'Centre PADI', 'Formation', 'Gonflage', 'Excursions plongée'],
    hours: '[À VÉRIFIER sur le site]',
  },
  {
    name: 'Dive Factory',
    address: 'Braine-l\'Alleud, Brabant Wallon',
    phone: null,
    email: null,
    website: 'https://www.divefactory.be',
    distance: '~45 km de Charleroi',
    services: ['Vente matériel', 'Apnée & snorkeling', 'Réparation'],
    hours: '[À VÉRIFIER sur le site]',
  },
]

// ─── Règles de palanquée LIFRAS ─────────────────────────────────────────────

const PALANQUEE_RULES = [
  { niveau: 'NB (Non-breveté)', profMax: '6 m', autonomie: 'Aucune — encadré', encadrant: 'P2★ minimum (ratio 1:1)', color: 'bg-gray-100 text-gray-700' },
  { niveau: 'P1★', profMax: '20 m', autonomie: 'Aucune — encadré', encadrant: 'P2★ minimum (ratio 1:2 max)', color: 'bg-blue-100 text-blue-700' },
  { niveau: 'P2★', profMax: '40 m', autonomie: 'Jusqu\'à 20 m en binôme P2', encadrant: 'P3★ ou GP pour > 20 m', color: 'bg-teal-100 text-teal-700' },
  { niveau: 'P3★', profMax: '60 m', autonomie: 'Jusqu\'à 40 m autonome', encadrant: 'Peut encadrer P1★ (max 20 m)', color: 'bg-green-100 text-green-700' },
  { niveau: 'P4★ / Guide de Palanquée', profMax: '60 m', autonomie: 'Toutes profondeurs (≤ 60 m)', encadrant: 'Peut diriger toutes palanquées', color: 'bg-purple-100 text-purple-700' },
]

const DP_RULES = [
  { role: 'Directeur de Palanquée (DP)', brevet: 'P3★ minimum', desc: 'Planifie et dirige la plongée. Responsable de la sécurité de toute la palanquée. Rédige le profil de plongée.' },
  { role: 'Serre-file (SF)', brevet: 'P2★ minimum', desc: 'Ferme la palanquée. Surveille les plongeurs en queue. Signale au DP tout problème.' },
  { role: 'Plongeur', brevet: 'Selon profondeur', desc: 'Respecte les consignes du DP. Surveille son niveau de gaz. Signale toute anomalie.' },
]

// ─── Composants ─────────────────────────────────────────────────────────────

function RulesTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#0077b6]" />
            Profondeurs et encadrement par niveau LIFRAS/CMAS
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="pb-2 pr-4">Niveau</th>
                <th className="pb-2 pr-4">Prof. max</th>
                <th className="pb-2 pr-4">Autonomie</th>
                <th className="pb-2">Encadrement requis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PALANQUEE_RULES.map((r) => (
                <tr key={r.niveau} className="py-2">
                  <td className="py-2.5 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.color}`}>
                      {r.niveau}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-semibold text-gray-900">{r.profMax}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{r.autonomie}</td>
                  <td className="py-2.5 text-gray-600">{r.encadrant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composition d'une palanquée</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-gray-600">Une palanquée doit comporter <strong>minimum 2 plongeurs</strong>.</p>
          {DP_RULES.map((r) => (
            <div key={r.role} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">{r.role}</span>
                <Badge variant="outline" className="text-xs">{r.brevet}</Badge>
              </div>
              <p className="text-gray-500 text-xs">{r.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Procédures de sécurité obligatoires</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Briefing obligatoire avant chaque immersion (profil, signaux, urgences)</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Vérification croisée de l'équipement (BUDDY CHECK)</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Certificat médical valide pour tous les plongeurs</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Palier de sécurité 5 m / 3 min obligatoire</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> SMB (bouée de signalement) recommandé, obligatoire en mer</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Vitesse de remontée ≤ 10 m/min</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Réserve de gaz : remonter avec minimum 50 bar</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Ne jamais plonger seul</li>
            <li className="flex gap-2"><span className="text-[#0077b6] font-bold">•</span> Centre hyperbare : CHU Vésale Charleroi 071/92.34.61 · SECOURS : 112</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function ShopsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Magasins de plongée agréés à proximité de Charleroi/Fleurus. Les horaires sont indicatifs — vérifiez sur les sites officiels.</p>
      {SHOPS.map((shop) => (
        <Card key={shop.name}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{shop.name}</p>
                <p className="text-xs text-gray-400">{shop.distance}</p>
              </div>
              {shop.website && (
                <a href={shop.website} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-blue-50">
                    <Globe className="h-3 w-3" /> Site web
                  </Badge>
                </a>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{shop.address}</span>
              </div>
              {shop.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${shop.phone}`} className="text-[#0077b6] hover:underline">{shop.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs italic">{shop.hours}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {shop.services.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LegalTab() {
  return (
    <div className="space-y-6 text-sm">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0077b6]" /> Mentions légales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-600">
          <div>
            <p className="font-semibold text-gray-900 mb-1">Éditeur de l'application</p>
            <p>L'application <strong>CPF Plongée</strong> est développée et maintenue par <strong>Anthony Capouet</strong> à titre bénévole pour le Club de Plongée Fleurusien (CPF ASBL).</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Club de Plongée Fleurusien</p>
            <p>ASBL · BCE 0429.763.052<br />Rue du Rabiseau 6, 6220 Fleurus<br />Email : info@cpfleurusien.be</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Hébergement</p>
            <p>Base de données : <strong>Supabase</strong> (infrastructure UE)<br />Application web : <strong>Vercel Inc.</strong></p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-semibold text-amber-900 mb-1">Limitation de responsabilité</p>
            <p className="text-amber-800">L'application est fournie "en l'état", sans garantie de disponibilité continue. Le développeur décline toute responsabilité en cas de perte de données, d'indisponibilité du service ou d'erreurs dans les informations affichées. Les données médicales et de certification sont sous la responsabilité exclusive du club et de ses membres.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" /> Politique de confidentialité — RGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-600">
          <div>
            <p className="font-semibold text-gray-900 mb-1">Données collectées</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Identité : nom complet, date de naissance</li>
              <li>Contact : adresse email, numéro de téléphone</li>
              <li>Certification : numéro LIFRAS, niveau de brevet</li>
              <li>Médical : type de document médical, date d'expiration</li>
              <li>Activités : inscriptions aux événements, historique de plongées</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Finalité du traitement</p>
            <p>Gestion des membres, organisation des activités de plongée et suivi de la conformité LIFRAS du Club de Plongée Fleurusien.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Base légale</p>
            <p>Consentement explicite donné lors de l'inscription à l'application.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Durée de conservation</p>
            <p>Durée d'adhésion au club + 2 ans après la dernière activité.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Vos droits</p>
            <p>Accès, rectification, suppression et portabilité de vos données sur demande à <a href="mailto:info@cpfleurusien.be" className="text-[#0077b6] hover:underline">info@cpfleurusien.be</a></p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Partage des données</p>
            <p>Aucune donnée n'est vendue ni partagée avec des tiers. Les données sont accessibles uniquement aux membres du CA et aux moniteurs du CPF.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Sécurité</p>
            <p>Les données sont stockées sur Supabase (infrastructure UE, chiffrée en transit et au repos) et Vercel (CDN sécurisé).</p>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-gray-400">Version 1.0 — Mai 2026 · Conformément au RGPD (UE) 2016/679</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function Useful() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Infos utiles</h1>
        <p className="text-gray-500 text-sm mt-1">Règles LIFRAS, magasins et informations légales.</p>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="rules" className="gap-2 text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Règles de palanquée
          </TabsTrigger>
          <TabsTrigger value="shops" className="gap-2 text-xs">
            <Store className="h-3.5 w-3.5" /> Magasins
          </TabsTrigger>
          <TabsTrigger value="legal" className="gap-2 text-xs">
            <Shield className="h-3.5 w-3.5" /> Mentions légales & RGPD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4"><RulesTab /></TabsContent>
        <TabsContent value="shops" className="mt-4"><ShopsTab /></TabsContent>
        <TabsContent value="legal" className="mt-4"><LegalTab /></TabsContent>
      </Tabs>
    </div>
  )
}
