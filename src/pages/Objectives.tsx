import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { OBJECTIFS, getObjectifsForNiveau, countTotal } from '../data/objectifs'
import { ChevronDown, ChevronUp, Target, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'

interface Progression {
  exercice_id: string
  completed: boolean
  validated_by: string | null
  notes: string | null
}

const BREVET_LABELS: Record<string, string> = {
  non_brevet: 'Non breveté', '1_etoile': 'P1★', '2_etoiles': 'P2★',
  '3_etoiles': 'P3★', '4_etoiles': 'P4★ / GP',
  moniteur_club: 'Moniteur Club', moniteur_federal: 'Moniteur Fédéral', instructeur: 'Instructeur',
}

export function Objectives() {
  const { user, profile, isAdmin, isMoniteur } = useAuth()
  const [progression, setProgression] = useState<Progression[]>([])
  const [loading, setLoading] = useState(true)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')

  const objectifs = getObjectifsForNiveau(profile?.brevet_level)

  const fetchProgression = useCallback(async () => {
    if (!user?.id || !objectifs) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('objectifs_progression')
      .select('exercice_id, completed, validated_by, notes')
      .eq('user_id', user.id)
      .eq('niveau', objectifs.niveau)
    setProgression((data ?? []) as unknown as Progression[])
    setLoading(false)
  }, [user?.id, objectifs?.niveau])

  useEffect(() => { fetchProgression() }, [fetchProgression])

  // Écouter le refresh global (pull-to-refresh)
  useEffect(() => {
    const handler = () => fetchProgression()
    window.addEventListener('cpf:refresh', handler)
    return () => window.removeEventListener('cpf:refresh', handler)
  }, [fetchProgression])

  async function toggle(exerciceId: string, checked: boolean) {
    if (!user?.id || !objectifs) return
    setProgression((prev) => {
      const exists = prev.find((p) => p.exercice_id === exerciceId)
      if (exists) return prev.map((p) => p.exercice_id === exerciceId ? { ...p, completed: checked } : p)
      return [...prev, { exercice_id: exerciceId, completed: checked, validated_by: null, notes: null }]
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('objectifs_progression') as any).upsert({
      user_id: user.id, niveau: objectifs.niveau,
      exercice_id: exerciceId, completed: checked,
      completed_at: checked ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,niveau,exercice_id' })
  }

  async function validate(exerciceId: string) {
    if (!user?.id || !objectifs) return
    setProgression((prev) => prev.map((p) =>
      p.exercice_id === exerciceId ? { ...p, validated_by: user.id } : p
    ))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('objectifs_progression') as any).upsert({
      user_id: user.id, niveau: objectifs.niveau,
      exercice_id: exerciceId, completed: true, validated_by: user.id,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,niveau,exercice_id' })
  }

  async function saveNote(exerciceId: string) {
    if (!user?.id || !objectifs) return
    setProgression((prev) => prev.map((p) =>
      p.exercice_id === exerciceId ? { ...p, notes: noteValue } : p
    ))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('objectifs_progression') as any).upsert({
      user_id: user.id, niveau: objectifs.niveau,
      exercice_id: exerciceId, notes: noteValue,
    }, { onConflict: 'user_id,niveau,exercice_id' })
    setEditingNote(null)
  }

  function getProg(exerciceId: string) {
    return progression.find((p) => p.exercice_id === exerciceId)
  }

  function toggleCat(catId: string) {
    setOpenCats((prev) => ({ ...prev, [catId]: !(prev[catId] !== false) }))
  }

  if (!objectifs) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold text-white mb-2">Félicitations !</h1>
        <p className="text-blue-100">
          Vous avez atteint le niveau {BREVET_LABELS[profile?.brevet_level ?? ''] ?? profile?.brevet_level}.
          Aucun objectif LIFRAS supplémentaire n'est disponible à ce niveau.
        </p>
      </div>
    )
  }

  const total = countTotal(objectifs)
  const done  = progression.filter((p) => p.completed).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="h-6 w-6" /> Objectifs
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          Niveau actuel : <strong>{BREVET_LABELS[profile?.brevet_level ?? 'non_brevet']}</strong>
          {' → '}Objectif : <strong>{BREVET_LABELS[objectifs.niveauCible] ?? objectifs.niveauCible}</strong>
        </p>
      </div>

      {/* Barre de progression */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-white text-sm">{objectifs.label}</p>
          <span className="text-2xl font-bold text-white">{pct}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5">
          <div className="bg-white h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-blue-200 mt-1.5">{done} / {total} exercices complétés</p>
      </div>

      {/* Catégories */}
      {loading ? (
        <div className="text-center py-8 text-blue-100">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {objectifs.categories.map((cat) => {
            const catDone = cat.exercices.filter((e) => getProg(e.id)?.completed).length
            const isOpen = openCats[cat.id] !== false
            return (
              <div key={cat.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 text-sm">{cat.label}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      catDone === cat.exercices.length
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-50 text-[#0077b6]'
                    }`}>
                      {catDone}/{cat.exercices.length}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="divide-y divide-gray-50 px-4 pb-2">
                    {cat.exercices.map((ex) => {
                      const prog = getProg(ex.id)
                      const isCompleted = prog?.completed ?? false
                      const isValidated = !!prog?.validated_by
                      const isNoteOpen = editingNote === ex.id

                      return (
                        <div key={ex.id} className="py-3 space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            {/* Checkbox custom */}
                            <div
                              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isCompleted
                                  ? isValidated ? 'bg-green-600 border-green-600' : 'bg-[#0077b6] border-[#0077b6]'
                                  : 'border-gray-300 group-hover:border-[#0077b6]'
                              }`}
                              onClick={() => toggle(ex.id, !isCompleted)}
                            >
                              {isCompleted && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm leading-snug ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {ex.label}
                              </span>
                              {ex.detail && (
                                <p className="text-xs text-gray-400 mt-0.5">{ex.detail}</p>
                              )}
                            </div>
                            {/* Badges */}
                            <div className="flex gap-1 flex-shrink-0">
                              {isValidated && (
                                <Badge className="text-xs bg-green-100 text-green-700 border-green-200 gap-1">
                                  <ShieldCheck className="h-3 w-3" /> Validé
                                </Badge>
                              )}
                              {ex.requiresValidation && !isValidated && (
                                <Badge variant="outline" className="text-xs text-gray-400">
                                  Moniteur requis
                                </Badge>
                              )}
                            </div>
                          </label>

                          {/* Actions moniteur/admin */}
                          <div className="flex items-center gap-2 pl-8">
                            {(isAdmin || isMoniteur) && isCompleted && !isValidated && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-green-700 border-green-200 hover:bg-green-50 gap-1"
                                onClick={() => validate(ex.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Valider
                              </Button>
                            )}
                            <button
                              className="text-xs text-gray-400 hover:text-[#0077b6] underline"
                              onClick={() => {
                                setEditingNote(isNoteOpen ? null : ex.id)
                                setNoteValue(prog?.notes ?? '')
                              }}
                            >
                              {prog?.notes ? '📝 Note' : '+ Note'}
                            </button>
                          </div>

                          {/* Champ note */}
                          {isNoteOpen && (
                            <div className="pl-8 space-y-1.5">
                              <Textarea
                                className="text-xs min-h-[60px]"
                                placeholder="Mes notes sur cet exercice…"
                                value={noteValue}
                                onChange={(e) => setNoteValue(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="h-7 px-3 text-xs" onClick={() => saveNote(ex.id)}>
                                  Enregistrer
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-3 text-xs" onClick={() => setEditingNote(null)}>
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}
                          {!isNoteOpen && prog?.notes && (
                            <p className="pl-8 text-xs text-gray-500 italic">📝 {prog.notes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
