import { Link } from 'react-router-dom'
import { ChevronRight, Target, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useMyObjectivesProgress } from '../../hooks/useMyObjectivesProgress'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { BREVET_LABELS } from '../../lib/compliance'
import type { BrevetLevel } from '../../types/database.types'

export function ObjectivesWidget() {
  const { profile } = useAuth()
  const { objectifs, total, completed, pct, remaining, loading } =
    useMyObjectivesProgress(profile?.id, profile?.brevet_level)

  // Ne rien afficher si pas d'objectifs définis ou tout terminé
  if (loading || !objectifs || total === 0 || remaining.length === 0) return null

  const currentLabel  = profile?.brevet_level
    ? (BREVET_LABELS[profile.brevet_level as BrevetLevel] ?? profile.brevet_level)
    : 'Non breveté'
  const targetLabel   = BREVET_LABELS[objectifs.niveauCible as BrevetLevel] ?? objectifs.niveauCible

  return (
    <Card>
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#0077b6]" />
            Mes objectifs
          </span>
          <Link to="/objectifs" className="text-xs font-medium text-[#0077b6] hover:text-[#005f8e] flex items-center gap-0.5">
            Tout voir <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-3 space-y-3">
        {/* Niveau actuel → cible */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{currentLabel}</span>
          <span className="text-gray-300 mx-1">→</span>
          <span className="font-semibold text-[#0077b6]">{targetLabel}</span>
          <span className="ml-auto font-bold text-gray-700">{completed}/{total}</span>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-[#0077b6] h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">{pct}% complété</p>

        {/* Prochains exercices (3 max) */}
        <div className="space-y-1.5 pt-0.5">
          {remaining.slice(0, 3).map(ex => (
            <div key={ex.id} className="flex items-start gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 mt-1.5" />
              <span className="leading-snug">{ex.label}</span>
            </div>
          ))}
          {remaining.length > 3 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>+ {remaining.length - 3} autre{remaining.length - 3 > 1 ? 's' : ''} exercice{remaining.length - 3 > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
