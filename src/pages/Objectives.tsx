import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { OBJECTIFS, getObjectifsForNiveau, countTotal } from '../data/objectifs'
import { ChevronDown, ChevronUp, Target } from 'lucide-react'

interface Progression {
  exercice_id: string
  completed: boolean
}

const NIVEAU_LABELS: Record<string, string> = {
  '1_etoile':  'Obtenir 1★',
  '2_etoiles': 'Obtenir 2★',
  '3_etoiles': 'Obtenir 3★',
  '4_etoiles': 'Obtenir 4★',
}

// Retourne le niveau CIBLE à atteindre selon le niveau actuel du membre
function getNiveauCible(brevetLevel: string | null | undefined): string | null {
  switch (brevetLevel) {
    case null:
    case undefined:
    case 'non_brevet':   return '1_etoile'
    case '1_etoile':     return '2_etoiles'
    case '2_etoiles':    return '3_etoiles'
    case '3_etoiles':    return '4_etoiles'
    default:             return null // 4★, moniteur, instructeur → niveau max
  }
}

export function Objectives() {
  const { user, profile } = useAuth()
  const [progression, setProgression] = useState<Progression[]>([])
  const [loading, setLoading] = useState(true)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [selectedNiveau, setSelectedNiveau] = useState<string>('')

  // Niveau affiché par défaut = le niveau CIBLE (suivant) du membre
  useEffect(() => {
    const cible = getNiveauCible(profile?.brevet_level)
    setSelectedNiveau(cible ?? '')
  }, [profile?.brevet_level])

  const fetchProgression = useCallback(async (niveau: string) => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('objectifs_progression')
      .select('exercice_id, completed')
      .eq('user_id', user.id)
      .eq('niveau', niveau)
    setProgression((data ?? []) as Progression[])
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (selectedNiveau) fetchProgression(selectedNiveau)
  }, [selectedNiveau, fetchProgression])

  async function toggle(exerciceId: string, checked: boolean) {
    if (!user?.id) return

    setProgression((prev) => {
      const exists = prev.find((p) => p.exercice_id === exerciceId)
      if (exists) return prev.map((p) => p.exercice_id === exerciceId ? { ...p, completed: checked } : p)
      return [...prev, { exercice_id: exerciceId, completed: checked }]
    })

    await supabase.from('objectifs_progression').upsert({
      user_id: user.id,
      niveau: selectedNiveau,
      exercice_id: exerciceId,
      completed: checked,
      completed_at: checked ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,niveau,exercice_id' })
  }

  function isCompleted(exerciceId: string): boolean {
    return progression.find((p) => p.exercice_id === exerciceId)?.completed ?? false
  }

  function toggleCat(catId: string) {
    setOpenCats((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  const niveauCibleDefaut = getNiveauCible(profile?.brevet_level)
  const niveauMax = niveauCibleDefaut === null // 4★ ou moniteur → niveau max atteint

  const objectifs = getObjectifsForNiveau(selectedNiveau)
  const total = objectifs ? countTotal(objectifs) : 0
  const done = progression.filter((p) => p.completed).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="h-6 w-6 text-[#0077b6]" />
          Objectifs par niveau
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Exercices à valider pour obtenir votre prochain brevet.
        </p>
      </div>

      {/* Niveau max atteint */}
      {niveauMax ? (
        <div className="bg-white rounded-xl border border-yellow-200 p-6 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-lg font-bold text-gray-900">Félicitations !</p>
          <p className="text-gray-500 text-sm mt-1">
            Vous avez atteint le niveau maximum. Consultez les objectifs des autres niveaux ci-dessous.
          </p>
        </div>
      ) : null}

      {/* Sélecteur de niveau — permet de consulter n'importe quel niveau */}
      <div className="flex flex-wrap gap-2">
        {OBJECTIFS.map((o) => (
          <button
            key={o.niveau}
            onClick={() => setSelectedNiveau(o.niveau)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedNiveau === o.niveau
                ? 'bg-[#0077b6] text-white'
                : o.niveau === niveauCibleDefaut
                ? 'bg-blue-100 text-[#0077b6] ring-2 ring-[#0077b6]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {NIVEAU_LABELS[o.niveau] ?? o.niveau}
            {o.niveau === niveauCibleDefaut && <span className="ml-1">←</span>}
          </button>
        ))}
      </div>

      {objectifs && (
        <>
          {/* Barre de progression */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{objectifs.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{objectifs.description}</p>
              </div>
              <span className="text-2xl font-bold text-[#0077b6]">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-[#0077b6] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{done} / {total} exercices complétés</p>
          </div>

          {/* Catégories */}
          {loading ? (
            <div className="text-center py-10 text-gray-400">Chargement…</div>
          ) : (
            <div className="space-y-3">
              {objectifs.categories.map((cat) => {
                const catDone = cat.exercices.filter((e) => isCompleted(e.id)).length
                const isOpen = openCats[cat.id] !== false // ouvert par défaut
                return (
                  <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 text-sm">{cat.label}</span>
                        <span className="text-xs bg-blue-50 text-[#0077b6] font-semibold px-2 py-0.5 rounded-full">
                          {catDone}/{cat.exercices.length}
                        </span>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-gray-50 px-4 pb-2">
                        {cat.exercices.map((ex) => {
                          const done = isCompleted(ex.id)
                          return (
                            <label
                              key={ex.id}
                              className="flex items-start gap-3 py-3 cursor-pointer group"
                            >
                              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                done ? 'bg-[#0077b6] border-[#0077b6]' : 'border-gray-300 group-hover:border-[#0077b6]'
                              }`}>
                                {done && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={done}
                                onChange={(e) => toggle(ex.id, e.target.checked)}
                              />
                              <div>
                                <span className={`text-sm leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  {ex.label}
                                </span>
                                {ex.detail && (
                                  <p className="text-xs text-gray-400 mt-0.5">{ex.detail}</p>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
