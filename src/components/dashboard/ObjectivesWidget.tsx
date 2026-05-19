import { Link } from 'react-router-dom'
import { ChevronRight, Target } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useMyObjectivesProgress } from '../../hooks/useMyObjectivesProgress'
import { Card, CardContent } from '../ui/card'

export function ObjectivesWidget() {
  const { profile } = useAuth()
  const { objectifs, total, completed, pct, remaining, loading } =
    useMyObjectivesProgress(profile?.id, profile?.brevet_level)

  if (loading || !objectifs || total === 0) return null

  const nextLabel = objectifs.label.replace(/^Objectifs pour obtenir /, '')

  return (
    <Link to="/objectifs">
      <Card className="border-blue-100 bg-blue-50/30 hover:bg-blue-50/60 transition-colors cursor-pointer">
        <CardContent className="p-4 space-y-2">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-[#0077b6]" />
              <p className="text-xs font-semibold text-[#0077b6]">{nextLabel}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#0077b6]">
              <span>{completed}/{total}</span>
              <ChevronRight className="h-3.5 w-3.5 text-blue-300" />
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-blue-100 rounded-full h-1.5">
            <div
              className="bg-[#0077b6] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Prochains exercices (2 max) */}
          {remaining.length > 0 ? (
            <div className="space-y-0.5">
              {remaining.slice(0, 2).map(ex => (
                <p key={ex.id} className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <span className="text-gray-300">·</span> {ex.label}
                </p>
              ))}
              {remaining.length > 2 && (
                <p className="text-xs text-gray-400 italic">
                  … et {remaining.length - 2} autre{remaining.length - 2 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-green-600 font-medium">✅ Tous les exercices complétés !</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
