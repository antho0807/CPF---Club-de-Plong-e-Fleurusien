import { useState, useCallback, useEffect } from 'react'
import { Plus, ThumbsUp, ThumbsDown, Minus, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import type { CAVote, VoteResponse } from '../../types/database.types'

const RESPONSE_CONFIG = {
  yes:     { icon: ThumbsUp,   label: 'Pour',      color: 'text-green-600 bg-green-50 border-green-200' },
  no:      { icon: ThumbsDown, label: 'Contre',    color: 'text-red-600 bg-red-50 border-red-200' },
  abstain: { icon: Minus,      label: 'Abstention', color: 'text-gray-500 bg-gray-50 border-gray-200' },
}

export function VotesTab() {
  const { profile, isAdmin } = useAuth()
  const [votes, setVotes] = useState<(CAVote & { myResponse?: VoteResponse | null; yes: number; no: number; abstain: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [voting, setVoting] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('ca_votes')
      .select('*, ca_vote_responses(member_id, response)')
      .order('created_at', { ascending: false })

    const enriched = (data ?? []).map((v: unknown) => {
      const vote = v as CAVote & { ca_vote_responses: { member_id: string; response: VoteResponse }[] }
      const responses = vote.ca_vote_responses ?? []
      return {
        ...vote,
        myResponse: responses.find(r => r.member_id === profile?.id)?.response ?? null,
        yes: responses.filter(r => r.response === 'yes').length,
        no: responses.filter(r => r.response === 'no').length,
        abstain: responses.filter(r => r.response === 'abstain').length,
      }
    })
    setVotes(enriched)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { refetch() }, [refetch])

  async function handleVote(voteId: string, response: VoteResponse) {
    if (!profile) return
    setVoting(voteId)
    await supabase.from('ca_vote_responses').upsert(
      { vote_id: voteId, member_id: profile.id, response },
      { onConflict: 'vote_id,member_id' }
    )
    await refetch()
    setVoting(null)
  }

  async function closeVote(id: string) {
    await supabase.from('ca_votes').update({ status: 'closed' }).eq('id', id)
    await refetch()
  }

  async function handleCreate() {
    if (!title) return
    setSaving(true)
    await supabase.from('ca_votes').insert({
      title, description: description || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      created_by: profile?.id,
    })
    setTitle(''); setDescription(''); setDeadline('')
    setShowForm(false)
    await refetch()
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{votes.filter(v => v.status === 'open').length} vote(s) ouvert(s)</p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Nouveau vote</Button>
      </div>

      {votes.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Aucun vote enregistré.</div>
      ) : (
        <div className="space-y-3">
          {votes.map(v => {
            const total = v.yes + v.no + v.abstain
            const isClosed = v.status !== 'open'
            return (
              <div key={v.id} className={`bg-white rounded-xl border p-4 space-y-3 shadow-sm ${isClosed ? 'border-gray-100 opacity-75' : 'border-gray-200'}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900">{v.title}</p>
                      {isClosed && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500"><Lock className="h-3 w-3 mr-1" />Clôturé</Badge>}
                    </div>
                    {v.description && <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>}
                    {v.deadline && <p className="text-xs text-orange-500 mt-0.5">Deadline : {new Date(v.deadline).toLocaleDateString('fr-BE')}</p>}
                  </div>
                </div>

                {/* Résultats */}
                <div className="flex gap-3 text-sm">
                  {(['yes', 'no', 'abstain'] as VoteResponse[]).map(r => {
                    const cfg = RESPONSE_CONFIG[r]
                    const count = v[r]
                    const pct = total > 0 ? Math.round(count / total * 100) : 0
                    return (
                      <div key={r} className="flex items-center gap-1.5 text-xs">
                        <cfg.icon className={`h-3.5 w-3.5 ${cfg.color.split(' ')[0]}`} />
                        <span className="font-semibold">{count}</span>
                        <span className="text-gray-400">({pct}%)</span>
                      </div>
                    )
                  })}
                  {total > 0 && <span className="text-xs text-gray-400 ml-auto">{total} votant(s)</span>}
                </div>

                {/* Boutons de vote */}
                {!isClosed && (
                  <div className="flex gap-2 flex-wrap">
                    {(['yes', 'no', 'abstain'] as VoteResponse[]).map(r => {
                      const cfg = RESPONSE_CONFIG[r]
                      const isMyVote = v.myResponse === r
                      return (
                        <button
                          key={r}
                          disabled={voting === v.id}
                          onClick={() => handleVote(v.id, r)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isMyVote ? cfg.color + ' border-current' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
                        </button>
                      )
                    })}
                    {isAdmin && (
                      <button onClick={() => closeVote(v.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 ml-auto">
                        <Lock className="h-3.5 w-3.5" /> Clôturer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau vote</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Question / Proposition *</Label><Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea className="mt-1" rows={3} value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><Label>Date limite <span className="text-gray-400 text-xs">(optionnel)</span></Label><Input type="datetime-local" className="mt-1" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={saving || !title}>{saving ? 'Création…' : 'Créer le vote'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
