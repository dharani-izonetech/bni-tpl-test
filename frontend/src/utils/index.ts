import type { MatchStatus, TournamentStatus } from '@/types'

// ── Date formatting ───────────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Cricket helpers ───────────────────────────────────────────────────────────

export function formatOvers(overs: number): string {
  const full = Math.floor(overs)
  const balls = Math.round((overs - full) * 10)
  return `${full}.${balls}`
}

export function calcStrikeRate(runs: number, balls: number): string {
  if (!balls) return '0.00'
  return ((runs / balls) * 100).toFixed(2)
}

export function formatNRR(nrr: number): string {
  return nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3)
}

export function getDismissalText(type: string | null, bowlerName?: string | null, fielderName?: string | null): string {
  if (!type) return 'not out'
  const map: Record<string, string> = {
    bowled:            'b',
    caught:            'c',
    lbw:               'lbw',
    run_out:           'run out',
    stumped:           'st',
    hit_wicket:        'hit wkt',
    retired_hurt:      'ret hurt',
    obstructing_field: 'obst field',
    handled_ball:      'handled ball',
    timed_out:         'timed out',
  }
  const short = map[type] ?? type
  if (type === 'bowled' && bowlerName) return `b ${bowlerName}`
  if (type === 'caught' && fielderName && bowlerName) return `c ${fielderName} b ${bowlerName}`
  if (type === 'caught' && bowlerName) return `c & b ${bowlerName}`
  if (type === 'lbw' && bowlerName) return `lbw b ${bowlerName}`
  if (type === 'stumped' && fielderName && bowlerName) return `st ${fielderName} b ${bowlerName}`
  if (type === 'run_out' && fielderName) return `run out (${fielderName})`
  return short
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

export function getMatchStatusBadge(status: MatchStatus): { label: string; color: string } {
  const map: Record<MatchStatus, { label: string; color: string }> = {
    scheduled:     { label: 'Scheduled',      color: 'bg-slate-500' },
    toss:          { label: 'Toss',           color: 'bg-yellow-500' },
    live:          { label: 'Live',           color: 'bg-green-500' },
    innings_break: { label: 'Innings Break',  color: 'bg-blue-500' },
    completed:     { label: 'Completed',      color: 'bg-slate-600' },
    abandoned:     { label: 'Abandoned',      color: 'bg-red-500' },
    cancelled:     { label: 'Cancelled',      color: 'bg-red-700' },
  }
  return map[status] ?? { label: status, color: 'bg-slate-500' }
}

export function getTournamentStatusBadge(status: TournamentStatus): { label: string; color: string } {
  const map: Record<TournamentStatus, { label: string; color: string }> = {
    upcoming:  { label: 'Upcoming',  color: 'bg-blue-500' },
    ongoing:   { label: 'Ongoing',   color: 'bg-green-500' },
    completed: { label: 'Completed', color: 'bg-slate-600' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500' },
  }
  return map[status] ?? { label: status, color: 'bg-slate-500' }
}

// ── Ball helpers ──────────────────────────────────────────────────────────────

export function getBallColor(ballType: string, isWicket: boolean, isSix?: boolean, isBoundary?: boolean): string {
  if (isWicket) return 'bg-red-600 text-white'
  if (isSix) return 'bg-purple-600 text-white'
  if (isBoundary) return 'bg-blue-600 text-white'
  switch (ballType) {
    case 'wide':    return 'bg-yellow-500 text-black'
    case 'no_ball': return 'bg-orange-500 text-white'
    case 'bye':
    case 'leg_bye': return 'bg-slate-500 text-white'
    default:        return 'bg-slate-700 text-white'
  }
}

export function getBallLabel(ballType: string, totalRuns: number, isWicket: boolean, extraRuns?: number): string {
  if (isWicket) return 'W'
  if (ballType === 'wide') return `Wd${(extraRuns ?? 0) > 1 ? `+${(extraRuns ?? 1) - 1}` : ''}`
  if (ballType === 'no_ball') return `Nb${totalRuns > 0 ? `+${totalRuns}` : ''}`
  if (ballType === 'bye') return `B${extraRuns ?? ''}`
  if (ballType === 'leg_bye') return `Lb${extraRuns ?? ''}`
  return String(totalRuns)
}
