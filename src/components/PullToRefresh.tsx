import { Loader2 } from 'lucide-react'

interface Props {
  refreshing: boolean
  pullDistance: number
}

export function PullToRefreshIndicator({ refreshing, pullDistance }: Props) {
  const THRESHOLD = 80
  const visible = refreshing || pullDistance > 10
  const progress = Math.min(pullDistance / THRESHOLD, 1)

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 pointer-events-none"
      style={{ height: refreshing ? 56 : pullDistance * 0.6, paddingTop: 8 }}
    >
      <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100">
        <Loader2
          className="h-5 w-5 text-[#0077b6]"
          style={{
            animation: refreshing ? 'spin 1s linear infinite' : 'none',
            transform: `rotate(${progress * 360}deg)`,
          }}
        />
        <span className="text-xs font-medium text-[#0077b6]">
          {refreshing ? 'Actualisation…' : progress >= 1 ? 'Relâcher' : 'Tirer pour actualiser'}
        </span>
      </div>
    </div>
  )
}
