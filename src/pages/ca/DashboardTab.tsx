import { TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, Calendar, Vote, Clock } from 'lucide-react'
import { useCADashboard } from '../../hooks/useCADashboard'
import { Card, CardContent } from '../../components/ui/card'

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Ajout',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
}

const TABLE_LABELS: Record<string, string> = {
  ca_treasury: 'Trésorerie',
  ca_stock_products: 'Stocks',
  ca_stock_movements: 'Mouvement stock',
  ca_meetings: 'Réunion',
  ca_votes: 'Vote',
  ca_documents: 'Document',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 2) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}

export function DashboardTab() {
  const { stats, loading } = useCADashboard()

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
      </div>
    )
  }

  const nextDate = stats.nextMeeting
    ? new Date(stats.nextMeeting.meeting_date).toLocaleDateString('fr-BE', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="space-y-6">
      {/* ── KPIs trésorerie ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="h-5 w-5 mx-auto mb-1 text-[#0077b6]" />
            <p className="text-xs text-gray-500 mb-0.5">Solde</p>
            <p className={`text-xl font-extrabold ${stats.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(0)} €
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-xs text-gray-500 mb-0.5">Recettes</p>
            <p className="text-xl font-extrabold text-green-700">+{stats.recettes.toFixed(0)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-gray-500 mb-0.5">Dépenses</p>
            <p className="text-xl font-extrabold text-red-600">{stats.depenses.toFixed(0)} €</p>
          </CardContent>
        </Card>
      </div>

      {/* ── KPIs opérationnels ── */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-[#0077b6]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{stats.caMembers}</p>
              <p className="text-xs text-gray-500">Membres CA</p>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.stockAlerts > 0 ? 'border-orange-200 bg-orange-50/40' : ''}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stats.stockAlerts > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`h-5 w-5 ${stats.stockAlerts > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className={`text-2xl font-extrabold ${stats.stockAlerts > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{stats.stockAlerts}</p>
              <p className="text-xs text-gray-500">Stock{stats.stockAlerts > 1 ? 's' : ''} faible{stats.stockAlerts > 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Prochaine réunion ── */}
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Prochaine réunion</p>
            {stats.nextMeeting ? (
              <>
                <p className="font-semibold text-gray-900 text-sm">{stats.nextMeeting.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{nextDate}</p>
                {stats.nextMeeting.location && <p className="text-xs text-gray-400">{stats.nextMeeting.location}</p>}
              </>
            ) : (
              <p className="text-sm text-gray-400">Aucune réunion planifiée</p>
            )}
          </div>
          {stats.openVotes > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <Vote className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">{stats.openVotes} vote{stats.openVotes > 1 ? 's' : ''} ouvert{stats.openVotes > 1 ? 's' : ''}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Activité récente (audit log) ── */}
      {stats.recentActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Activité récente
          </p>
          <Card>
            <CardContent className="p-0 divide-y divide-gray-50">
              {stats.recentActions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    a.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                    a.action === 'DELETE' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>{ACTION_LABELS[a.action] ?? a.action}</span>
                  <span className="text-xs text-gray-700 flex-1">{TABLE_LABELS[a.table_name] ?? a.table_name}</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(a.created_at)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
