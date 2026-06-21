import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scoringApi, matchesApi, teamsApi } from '@/api/services'
import { useMatchWebSocket } from '@/hooks/useWebSocket'
import { Badge, Spinner, Modal } from '@/components/common'
import { getBallColor, getBallLabel, formatOvers, calcStrikeRate } from '@/utils'
import type { BallType, DismissalType, PlayerProfile } from '@/types'
import toast from 'react-hot-toast'

const BALL_TYPES: { value: BallType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'no_ball', label: 'No Ball' },
  { value: 'bye', label: 'Bye' },
  { value: 'leg_bye', label: 'Leg Bye' },
]

const DISMISSALS: DismissalType[] = [
  'bowled', 'caught', 'lbw', 'run_out', 'stumped',
  'hit_wicket', 'obstructing_field', 'timed_out', 'retired_hurt',
]

export default function LiveScoringPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const mid = matchId!
  const qc = useQueryClient()
  const { isConnected, lastUpdate } = useMatchWebSocket(mid)

  const [ballType, setBallType] = useState<BallType>('normal')
  const [runs, setRuns] = useState(0)
  const [extraRuns, setExtraRuns] = useState(0)
  const [isWicket, setIsWicket] = useState(false)
  const [dismissal, setDismissal] = useState<DismissalType | null>(null)
  const [dismissedPlayerId, setDismissedPlayerId] = useState<number | null>(null)
  const [dismissedIsNonStriker, setDismissedIsNonStriker] = useState(false)  // Feature 1
  const [fielderId, setFielderId] = useState<number | null>(null)            // Feature 7
  const [fielder2Id, setFielder2Id] = useState<number | null>(null)          // Feature 7
  const [keeperId, setKeeperId] = useState<number | null>(null)              // Feature 7
  const [isBounce, setIsBounce] = useState(false)                            // Feature 2
  const [bounceWarning, setBounceWarning] = useState<string | null>(null)    // Feature 2
  const [isFreeHit, setIsFreeHit] = useState(false)
  const [commentary, setCommentary] = useState('')
  const [showWicketModal, setShowWicketModal] = useState(false)
  const [dismissedBatsmanCard, setDismissedBatsmanCard] = useState<{       // Feature 8
    name: string; runs: number; balls: number; fours: number; sixes: number;
    sr: number; dismissal: string;
  } | null>(null)

  const [strikerId, setStrikerId] = useState<number | null>(null)
  const [nonStrikerId, setNonStrikerId] = useState<number | null>(null)
  const [bowlerId, setBowlerId] = useState<number | null>(null)
  const [wicketJustFell, setWicketJustFell] = useState(false)
  const [nonStrikerWicketFell, setNonStrikerWicketFell] = useState(false)  // Feature 1: non-striker out
  const [outBatsmanName, setOutBatsmanName] = useState<string | null>(null)

  // Load match first — always has team1_id / team2_id
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ['match', mid],
    queryFn: () => matchesApi.get(mid),
  })

  const { data: liveData, isLoading: liveLoading, refetch } = useQuery({
    queryKey: ['live', mid],
    queryFn: () => scoringApi.getLiveScore(mid),
    refetchInterval: 8000,
    enabled: !!match,
  })

  // Use dedicated /players endpoint — returns PlayerProfile[] with user data
  const { data: team1Players = [], isLoading: t1Loading } = useQuery({
    queryKey: ['team-players', match?.team1_id],
    queryFn: () => teamsApi.getPlayers(match!.team1_id),
    enabled: !!match?.team1_id,
  })

  const { data: team2Players = [], isLoading: t2Loading } = useQuery({
    queryKey: ['team-players', match?.team2_id],
    queryFn: () => teamsApi.getPlayers(match!.team2_id),
    enabled: !!match?.team2_id,
  })

  useEffect(() => {
    if (lastUpdate) refetch()
  }, [lastUpdate, refetch])

  // Determine batting/bowling player lists from innings, fallback to team1/team2
  const innings = liveData?.current_innings
  const battingTeamId = innings?.batting_team_id ?? match?.team1_id
  const battingPlayers: PlayerProfile[] =
    battingTeamId === match?.team1_id ? team1Players : team2Players
  const bowlingPlayers: PlayerProfile[] =
    battingTeamId === match?.team1_id ? team2Players : team1Players

  // Reset player selections when innings changes
  const [lastInningsId, setLastInningsId] = useState<number | null>(null)
  useEffect(() => {
    if (innings?.id && innings.id !== lastInningsId) {
      setLastInningsId(innings.id)
      setStrikerId(null)
      setNonStrikerId(null)
      setBowlerId(null)
      setWicketJustFell(false)
      setOutBatsmanName(null)
    }
  }, [innings?.id])

  // Auto-fill from last ball ONLY when balls have actually been bowled
  useEffect(() => {
    if (!liveData?.last_five_balls?.length) return  // no balls yet — don't auto-fill
    if (liveData?.striker?.batsman_id && !strikerId)
      setStrikerId(liveData.striker.batsman_id)
    if (liveData?.non_striker?.batsman_id && !nonStrikerId)
      setNonStrikerId(liveData.non_striker.batsman_id)
    if (liveData?.current_bowler?.bowler_id && !bowlerId)
      setBowlerId(liveData.current_bowler.bowler_id)
  }, [liveData])

  const lastFive = liveData?.last_five_balls || []
  const playersLoading = t1Loading || t2Loading

  const recordBall = useMutation({
    mutationFn: (data: Parameters<typeof scoringApi.recordBall>[1]) =>
      scoringApi.recordBall(innings!.id, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['live', mid] })

      // Rotate strike on odd runs
      const totalRuns = (variables.runs_off_bat ?? 0) + (variables.extra_runs ?? 0)
      // On wide, the +1 is already included in extra_runs but doesn't cause rotation
      // Rotation is based on runs actually run between wickets (batter runs + bye runs)
      const runForRotation =
        variables.ball_type === 'wide'
          ? (variables.extra_runs ?? 0) - 1  // subtract the auto wide penalty
          : variables.ball_type === 'no_ball'
          ? (variables.runs_off_bat ?? 0) + ((variables.extra_runs ?? 0) - 1) // subtract auto NB penalty
          : totalRuns
      const isLegal = !variables.ball_type || variables.ball_type === 'normal' || variables.ball_type === 'bye' || variables.ball_type === 'leg_bye'
      
      if (variables.is_wicket) {
        // Feature 1: dismissed could be striker OR non-striker
        const outId = variables.dismissed_is_non_striker
          ? nonStrikerId
          : (variables.dismissed_player_id ?? strikerId)
        const outPlayer = battingPlayers.find(p => p.id === outId)
        const outScore = outPlayer
          ? (liveData?.striker?.batsman_id === outId ? liveData.striker : liveData?.non_striker)
          : null
        const outName = outPlayer
          ? ((outPlayer as any).full_name || (outPlayer as any).username || `Player #${outId}`)
          : `Player #${outId}`

        // Feature 8: show dismissed batsman card
        if (outScore) {
          const sr = outScore.balls_faced > 0
            ? Math.round((outScore.runs / outScore.balls_faced) * 1000) / 10
            : 0
          setDismissedBatsmanCard({
            name: outName,
            runs: outScore.runs,
            balls: outScore.balls_faced,
            fours: outScore.fours ?? 0,
            sixes: outScore.sixes ?? 0,
            sr,
            dismissal: variables.dismissal_type
              ? String(variables.dismissal_type).replace(/_/g, ' ')
              : 'out',
          })
        }

        setOutBatsmanName(outName)
        // Only clear striker if striker was dismissed
        if (!variables.dismissed_is_non_striker) {
          setStrikerId(null)
          setWicketJustFell(true)
        } else {
          // Non-striker dismissed — non-striker slot needs a new player
          setNonStrikerId(null)
          setNonStrikerWicketFell(true)
        }
        toast.error(
          `🔴 Wicket! ${outName} is out (${variables.dismissed_is_non_striker ? 'non-striker' : 'striker'}) — select next batsman`,
          { duration: 5000 },
        )
      } else if (runForRotation % 2 === 1) {
        // Odd runs — swap striker and non-striker
        setStrikerId(prev => {
          const newStriker = nonStrikerId
          setNonStrikerId(prev)
          return newStriker
        })
      }

      resetForm()
      toast.success('Ball recorded ✓')
    },
  })

  const undoBall = useMutation({
    mutationFn: () => scoringApi.undoLastBall(innings!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live', mid] })
      toast.success('Last ball undone')
    },
  })

  const resetForm = () => {
    setRuns(0); setExtraRuns(0); setBallType('normal')
    setIsWicket(false); setDismissal(null); setDismissedPlayerId(null)
    setDismissedIsNonStriker(false)
    setFielderId(null); setFielder2Id(null); setKeeperId(null)
    setIsBounce(false); setBounceWarning(null)
    setIsFreeHit(false); setCommentary(''); setShowWicketModal(false)
  }

  const handleRecord = () => {
    if (!innings) { toast.error('No active innings — start innings first'); return }
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error('Select striker, non-striker and bowler first'); return
    }
    if (strikerId === nonStrikerId) {
      toast.error('Striker and non-striker must be different players'); return
    }
    if (isWicket && !dismissal) { setShowWicketModal(true); return }

    // Wide:   +1 auto penalty + any additional bye runs scorer entered
    // No Ball: +1 auto penalty + scorer's extra_runs are runs off the no-ball
    // Normal/Bye: send extra_runs as-is
    let finalExtraRuns = extraRuns
    if (ballType === 'wide') {
      finalExtraRuns = 1 + extraRuns   // 1 auto wide + any additional byes
    } else if (ballType === 'no_ball') {
      finalExtraRuns = 1 + extraRuns   // 1 auto no-ball penalty + batter's hit extras
    }

    recordBall.mutate({
      batsman_id: strikerId,
      bowler_id: bowlerId,
      non_striker_id: nonStrikerId,
      runs_off_bat: runs,
      extra_runs: finalExtraRuns,
      ball_type: ballType,
      is_wicket: isWicket,
      dismissal_type: dismissal || undefined,
      dismissed_player_id: dismissedIsNonStriker ? nonStrikerId : (dismissedPlayerId || strikerId),
      dismissed_is_non_striker: dismissedIsNonStriker,
      fielder_id: fielderId || undefined,
      fielder2_id: fielder2Id || undefined,
      wicket_keeper_id: keeperId || undefined,
      is_free_hit: isFreeHit,
      is_bounce: isBounce,
      commentary: commentary || undefined,
    })
  }

  const playerLabel = (p: PlayerProfile) => {
    const name = (p as any).full_name || (p as any).username || `Player #${p.id}`
    return `${name}${p.jersey_number ? ` (#${p.jersey_number})` : ''}`
  }

  if (matchLoading || liveLoading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  )
  if (!match) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Match not found</p>
      <Link to="/matches" className="btn-primary mt-4 inline-block">Back to Matches</Link>
    </div>
  )

  const progressPct = innings ? (innings.total_overs / match.overs) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={`/matches/${mid}`} className="text-slate-500 hover:text-slate-900 text-sm font-medium">← Match Details</Link>
        <div className="flex items-center gap-2">
          {isConnected
            ? <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Live</span>
            : <span className="text-slate-400 text-xs">Reconnecting...</span>}
          <Badge label="LIVE" color="bg-green-600" />
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-semibold text-primary-100">{innings?.batting_team?.name ?? match.team1?.name}</span>
            <span className="text-xs text-primary-300 ml-1">batting</span>
          </div>
          <div>
            <span className="text-xs text-primary-300 mr-1">bowling</span>
            <span className="text-sm font-semibold text-primary-100">{innings?.bowling_team?.name ?? match.team2?.name}</span>
          </div>
        </div>
        <div className="text-center mb-3">
          <div className="font-display text-6xl text-white tracking-wider">
            {innings?.total_runs ?? 0}/{innings?.total_wickets ?? 0}
          </div>
          <div className="text-primary-200 text-lg mt-1">
            ({formatOvers(innings?.total_overs ?? 0)}/{match.overs} ov)
          </div>
          {innings?.target && (
            <div className="mt-1 text-sm text-primary-200">
              Target: <span className="text-white font-bold">{innings.target}</span>
              {liveData?.required_runs != null && <span className="ml-2">• Need {liveData.required_runs} off {liveData.balls_remaining} balls</span>}
            </div>
          )}
        </div>
        <div className="h-2 bg-primary-900/40 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${Math.min(progressPct, 100)}%` }} />
        </div>
        {innings && (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'CRR', value: liveData?.current_run_rate?.toFixed(2) ?? '0.00', color: 'text-white' },
              { label: 'RRR', value: liveData?.required_run_rate?.toFixed(2) ?? '—', color: 'text-yellow-300' },
              { label: 'Extras', value: innings.extras_wide + innings.extras_no_ball + innings.extras_bye + innings.extras_leg_bye, color: 'text-white' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-lg p-2">
                <div className={`font-bold text-lg ${s.color}`}>{s.value}</div>
                <div className="text-primary-200 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Over-by-Over Display */}
      {lastFive.length > 0 && (() => {
        // Group balls by over number
        const allBalls = liveData?.last_five_balls || []
        const overGroups: Record<number, typeof allBalls> = {}
        allBalls.forEach(b => {
          const ov = b.over_number
          if (!overGroups[ov]) overGroups[ov] = []
          overGroups[ov].push(b)
        })
        const currentOverNum = Math.floor(innings?.total_overs ?? 0) + 1
        const ballsInCurrentOver = Math.round(((innings?.total_overs ?? 0) % 1) * 10)

        return (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                Over {currentOverNum} ({ballsInCurrentOver}/6 balls)
              </div>
              <div className="text-xs font-semibold text-primary-600">
                {formatOvers(innings?.total_overs ?? 0)}/{match.overs} ov
              </div>
            </div>

            {/* Current over balls */}
            <div className="flex gap-2 flex-wrap">
              {allBalls.filter(b => b.over_number === currentOverNum).map(b => (
                <div key={b.id} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${getBallColor(b.ball_type, b.is_wicket, b.is_six, b.is_boundary)}`}>
                  {getBallLabel(b.ball_type, b.total_runs, b.is_wicket)}
                </div>
              ))}
              {/* Empty slots remaining */}
              {Array.from({ length: Math.max(0, 6 - ballsInCurrentOver) }).map((_, i) => (
                <div key={`empty-${i}`} className="w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 border-dashed border-slate-200 text-slate-300">
                  •
                </div>
              ))}
            </div>

            {/* Previous overs summary */}
            {Object.keys(overGroups).length > 1 && (
              <div className="border-t border-slate-100 pt-2 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase">Previous Overs</p>
                {Object.entries(overGroups)
                  .filter(([ov]) => Number(ov) < currentOverNum)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([overNum, balls]) => (
                    <div key={overNum} className="flex items-center gap-2">
                      <span className="w-12 text-xs font-bold text-slate-600">Over {overNum}</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {balls.map(b => (
                          <div key={b.id} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getBallColor(b.ball_type, b.is_wicket, b.is_six, b.is_boundary)}`}>
                            {getBallLabel(b.ball_type, b.total_runs, b.is_wicket)}
                          </div>
                        ))}
                      </div>
                      <span className="ml-auto text-xs text-slate-500">
                        {balls.reduce((s, b) => s + b.total_runs, 0)} runs
                      </span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Wicket — new batsman required banner ── */}
      {(wicketJustFell || nonStrikerWicketFell) && (
        <div style={{
          padding: "14px 18px",
          borderRadius: 12,
          background: "linear-gradient(135deg,#E53935,#B71C1C)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 4,
          boxShadow: "0 4px 20px rgba(229,57,53,0.35)",
          animation: "wicket-pulse 1.6s ease-in-out infinite",
        }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🔴</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.03em" }}>
              WICKET! {outBatsmanName ? `${outBatsmanName} is out` : "Batsman out"}
              {nonStrikerWicketFell ? " (non-striker)." : "."}
            </p>
            <p style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              ↓ Select the next batsman as <strong>{nonStrikerWicketFell ? "Non-Striker" : "Striker"}</strong> to continue.
            </p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes wicket-pulse {
          0%,100% { box-shadow: 0 4px 20px rgba(229,57,53,0.35); }
          50%      { box-shadow: 0 4px 32px rgba(229,57,53,0.65); }
        }
      `}</style>

      {/* ── Player Selection ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900">🏏 Select Players</h3>
          {playersLoading && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
              Loading players…
            </span>
          )}
          {!playersLoading && battingPlayers.length === 0 && bowlingPlayers.length === 0 && (
            <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
              No players found in these teams
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Striker */}
          <div>
            <label className="block text-xs font-semibold text-primary-700 mb-1">
              {wicketJustFell
                ? <span style={{ color: "#E53935", fontWeight: 800 }}>🔴 Select New Batsman *</span>
                : <>⚡ Striker (Batsman)</>}
              {battingPlayers.length > 0 && <span className="text-slate-400 font-normal ml-1">({battingPlayers.length} players)</span>}
            </label>
            <select
              value={strikerId ?? ''}
              onChange={e => {
                const id = e.target.value ? Number(e.target.value) : null
                if (id && id === nonStrikerId) {
                  toast.error('Striker and non-striker must be different players')
                  return
                }
                setStrikerId(id)
                if (id) {
                  setWicketJustFell(false)
                  setOutBatsmanName(null)
                }
              }}
              className={`input text-sm ${wicketJustFell ? 'border-red-500 ring-2 ring-red-400 ring-offset-1' : strikerId && strikerId === nonStrikerId ? 'border-red-400 ring-1 ring-red-400' : ''}`}
            >
              <option value="">— Select striker —</option>
              {battingPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {playerLabel(p)}{p.id === nonStrikerId ? ' (non-striker)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Non-striker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {nonStrikerWicketFell
                ? <span style={{ color: "#E53935", fontWeight: 800 }}>🔴 Select New Batsman *</span>
                : <>Non-Striker</>}
              {battingPlayers.length > 0 && <span className="text-slate-400 font-normal ml-1">({battingPlayers.length} players)</span>}
            </label>
            <select
              value={nonStrikerId ?? ''}
              onChange={e => {
                const id = e.target.value ? Number(e.target.value) : null
                if (id && id === strikerId) {
                  toast.error('Non-striker must be a different player from the striker')
                  return
                }
                setNonStrikerId(id)
                if (id) {
                  setNonStrikerWicketFell(false)
                  setOutBatsmanName(null)
                }
              }}
              className={`input text-sm ${nonStrikerWicketFell ? 'border-red-500 ring-2 ring-red-400 ring-offset-1' : nonStrikerId && nonStrikerId === strikerId ? 'border-red-400 ring-1 ring-red-400' : ''}`}
            >
              <option value="">— Select non-striker —</option>
              {battingPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {playerLabel(p)}{p.id === strikerId ? ' (striker)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Bowler */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              🎳 Bowler
              {bowlingPlayers.length > 0 && <span className="text-slate-400 font-normal ml-1">({bowlingPlayers.length} players)</span>}
            </label>
            <select
              value={bowlerId ?? ''}
              onChange={e => setBowlerId(e.target.value ? Number(e.target.value) : null)}
              className="input text-sm"
            >
              <option value="">— Select bowler —</option>
              {bowlingPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {playerLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conflict warning */}
        {strikerId && nonStrikerId && strikerId === nonStrikerId && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
            ⚠️ Striker and non-striker cannot be the same player. Please select different players.
          </div>
        )}

        {/* Selected summary chips */}
        {(strikerId || nonStrikerId || bowlerId) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {strikerId && (
              <span className="text-xs bg-primary-100 text-primary-700 border border-primary-200 px-2 py-1 rounded-full font-medium">
                ⚡ {(() => { const p = battingPlayers.find(p => p.id === strikerId); return p ? ((p as any).full_name || (p as any).username || `#${strikerId}`) : `#${strikerId}` })()}
              </span>
            )}
            {nonStrikerId && (
              <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-full font-medium">
                🏃 {(() => { const p = battingPlayers.find(p => p.id === nonStrikerId); return p ? ((p as any).full_name || (p as any).username || `#${nonStrikerId}`) : `#${nonStrikerId}` })()}
              </span>
            )}
            {bowlerId && (
              <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded-full font-medium">
                🎳 {(() => { const p = bowlingPlayers.find(p => p.id === bowlerId); return p ? ((p as any).full_name || (p as any).username || `#${bowlerId}`) : `#${bowlerId}` })()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Live batsmen stats */}
      {liveData && (liveData.striker || liveData.non_striker) && (
        <div className="grid grid-cols-2 gap-3">
          {liveData.striker && (
            <div className="card border-primary-300 bg-primary-50">
              <div className="text-xs text-primary-600 font-semibold mb-1">⚡ Striker</div>
              <div className="font-semibold text-slate-900 text-sm truncate">{(liveData.striker as any).batsman_name || `Player #${liveData.striker.batsman_id}`}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {liveData.striker.runs} <span className="text-base text-slate-500">({liveData.striker.balls_faced})</span>
              </div>
              <div className="flex gap-3 text-xs text-slate-500 mt-1">
                <span>SR: {calcStrikeRate(liveData.striker.runs, liveData.striker.balls_faced)}</span>
                <span>4s: {liveData.striker.fours}</span>
                <span>6s: {liveData.striker.sixes}</span>
              </div>
            </div>
          )}
          {liveData.non_striker && (
            <div className="card">
              <div className="text-xs text-slate-500 font-semibold mb-1">Non-striker</div>
              <div className="font-semibold text-slate-900 text-sm truncate">{(liveData.non_striker as any).batsman_name || `Player #${liveData.non_striker.batsman_id}`}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {liveData.non_striker.runs} <span className="text-base text-slate-500">({liveData.non_striker.balls_faced})</span>
              </div>
              <div className="flex gap-3 text-xs text-slate-500 mt-1">
                <span>SR: {calcStrikeRate(liveData.non_striker.runs, liveData.non_striker.balls_faced)}</span>
                <span>4s: {liveData.non_striker.fours}</span>
                <span>6s: {liveData.non_striker.sixes}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live bowler stats */}
      {liveData?.current_bowler && (
        <div className="card">
          <div className="text-xs text-slate-500 font-semibold mb-1">🎳 Current Bowler</div>
          <div className="flex justify-between items-center">
            <div className="font-semibold text-slate-900">{(liveData.current_bowler as any).bowler_name || `Bowler #${liveData.current_bowler.bowler_id}`}</div>
            <div className="text-right text-sm">
              <span className="text-slate-900 font-bold">{liveData.current_bowler.wickets}/{liveData.current_bowler.runs}</span>
              <span className="text-slate-500 ml-1">({formatOvers(liveData.current_bowler.overs)})</span>
              <span className="text-slate-500 ml-2">Econ: {liveData.current_bowler.economy_rate.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature 8: Dismissed Batsman Card ── */}
      {dismissedBatsmanCard && (
        <div className="card border-red-300 bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">🔴 OUT</span>
            <button onClick={() => setDismissedBatsmanCard(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          </div>
          <div className="font-bold text-slate-900 text-base mb-1">{dismissedBatsmanCard.name}</div>
          <div className="text-3xl font-black text-slate-900">
            {dismissedBatsmanCard.runs}
            <span className="text-base font-semibold text-slate-500 ml-1">({dismissedBatsmanCard.balls}b)</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-600 mt-1">
            <span>4s: <strong>{dismissedBatsmanCard.fours}</strong></span>
            <span>6s: <strong>{dismissedBatsmanCard.sixes}</strong></span>
            <span>SR: <strong>{dismissedBatsmanCard.sr.toFixed(1)}</strong></span>
          </div>
          <div className="mt-2 text-xs font-semibold text-red-600 capitalize">
            {dismissedBatsmanCard.dismissal}
          </div>
        </div>
      )}

      {/* ── Scoring Controls ── */}
      {innings && !innings.is_completed ? (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Score This Ball</h3>
            <button onClick={() => undoBall.mutate()} disabled={undoBall.isPending}
              className="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium">
              ↩ Undo Last Ball
            </button>
          </div>

          {/* Ball type */}
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">Ball Type</div>
            <div className="flex gap-2 flex-wrap">
              {BALL_TYPES.map(bt => (
                <button key={bt.value} onClick={() => { setBallType(bt.value); setExtraRuns(0) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    ballType === bt.value
                      ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                      : 'border-slate-300 text-slate-600 hover:border-primary-400 bg-white'
                  }`}>
                  {bt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature 2: Bounce toggle */}
          {(ballType === 'normal' || ballType === 'no_ball') && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={isBounce}
                  onChange={e => {
                    setIsBounce(e.target.checked)
                    setBounceWarning(null)
                  }}
                  className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-slate-700 font-medium">🏐 Bounce Ball</span>
              </label>
              {isBounce && (
                <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg font-medium">
                  2nd bounce in over → auto No Ball
                </span>
              )}
            </div>
          )}

          {/* Runs */}
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">Runs Off Bat</div>
            <div className="flex gap-2 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6].map(r => (
                <button key={r} onClick={() => setRuns(r)}
                  className={`w-11 h-11 rounded-xl text-lg font-bold transition-all border ${
                    runs === r
                      ? r === 4 ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                        : r === 6 ? 'border-purple-500 bg-purple-500 text-white shadow-md'
                        : 'border-primary-500 bg-primary-600 text-white shadow-md'
                      : 'border-slate-300 text-slate-700 hover:border-primary-400 bg-white hover:bg-primary-50'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Extra runs — wide, no ball, bye, leg bye */}
          {ballType !== 'normal' && (
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">
                {ballType === 'wide'    && 'Additional Bye Runs off Wide (auto +1 added)'}
                {ballType === 'no_ball' && 'Additional Runs off No Ball (auto +1 added)'}
                {ballType === 'bye'     && 'Bye Runs'}
                {ballType === 'leg_bye' && 'Leg Bye Runs'}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6].map(r => (
                  <button key={r} onClick={() => setExtraRuns(r)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all border ${
                      extraRuns === r
                        ? 'border-yellow-500 bg-yellow-500 text-white shadow-sm'
                        : 'border-slate-300 text-slate-600 bg-white hover:border-yellow-400 hover:bg-yellow-50'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wicket / Free hit */}
          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isWicket}
                onChange={e => { setIsWicket(e.target.checked); if (e.target.checked) setShowWicketModal(true) }}
                className="w-4 h-4 accent-red-500" />
              <span className="text-sm text-slate-700 font-medium">🔴 Wicket</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isFreeHit} onChange={e => setIsFreeHit(e.target.checked)}
                className="w-4 h-4 accent-yellow-500" />
              <span className="text-sm text-slate-700 font-medium">⭐ Free Hit</span>
            </label>
          </div>

          {/* Wicket summary bar */}
          {isWicket && dismissal && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-sm font-semibold capitalize">🔴 {dismissal.replace(/_/g, ' ')}</span>
                {dismissedIsNonStriker && (
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold">Non-Striker</span>
                )}
                <button onClick={() => setShowWicketModal(true)} className="text-xs text-red-500 underline ml-auto">Change</button>
              </div>

              {/* Feature 7: Fielder attribution */}
              {(dismissal === 'caught' || dismissal === 'run_out' || dismissal === 'stumped') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-red-200">
                  {dismissal === 'stumped' || dismissal === 'caught' ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        {dismissal === 'stumped' ? '🧤 Wicket Keeper' : '🙌 Catcher / Keeper'}
                      </label>
                      <select value={keeperId ?? ''} onChange={e => setKeeperId(e.target.value ? Number(e.target.value) : null)} className="input text-sm">
                        <option value="">— Select —</option>
                        {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{playerLabel(p)}</option>)}
                      </select>
                    </div>
                  ) : null}
                  {dismissal === 'run_out' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">🏃 Fielder 1</label>
                        <select value={fielderId ?? ''} onChange={e => setFielderId(e.target.value ? Number(e.target.value) : null)} className="input text-sm">
                          <option value="">— Select —</option>
                          {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{playerLabel(p)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">🏃 Fielder 2 (relay)</label>
                        <select value={fielder2Id ?? ''} onChange={e => setFielder2Id(e.target.value ? Number(e.target.value) : null)} className="input text-sm">
                          <option value="">— None —</option>
                          {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{playerLabel(p)}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  {dismissal === 'caught' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">🙌 Fielder (if not keeper)</label>
                      <select value={fielderId ?? ''} onChange={e => setFielderId(e.target.value ? Number(e.target.value) : null)} className="input text-sm">
                        <option value="">— Select —</option>
                        {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{playerLabel(p)}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <input value={commentary} onChange={e => setCommentary(e.target.value)}
            placeholder="Add commentary (optional)..." className="input text-sm" />

          <button onClick={handleRecord}
            disabled={recordBall.isPending || !strikerId || !nonStrikerId || !bowlerId || wicketJustFell || nonStrikerWicketFell}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
            {recordBall.isPending ? <Spinner size="sm" />
              : (wicketJustFell || nonStrikerWicketFell) ? '🔴 Select new batsman first'
              : '🏏'}
            {!(wicketJustFell || nonStrikerWicketFell) && (() => {
              const autoExtra = (ballType === 'wide' || ballType === 'no_ball') ? 1 : 0
              const totalDisplay = runs + extraRuns + autoExtra
              return <>
                Record — {totalDisplay} run{totalDisplay !== 1 ? 's' : ''}
                {ballType !== 'normal' ? ` (${ballType.replace(/_/g, ' ')}${autoExtra ? ' +1 auto' : ''})` : ''}
                {isBounce ? ' 🏐' : ''}
                {isWicket ? ' + WICKET' : ''}
              </>
            })()}
          </button>
        </div>
      ) : innings?.is_completed ? (
        <div className="card text-center py-8 bg-green-50 border-green-200">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-lg font-bold text-green-800">Innings Completed</h3>
          <p className="text-green-600 text-sm mt-1">
            {innings.batting_team?.name}: {innings.total_runs}/{innings.total_wickets} ({formatOvers(innings.total_overs)} ov)
          </p>
        </div>
      ) : (
        <div className="card text-center py-6 bg-amber-50 border-amber-200">
          <p className="text-amber-700 font-medium">Match not started yet. Start innings from Match Details.</p>
        </div>
      )}

      {/* Wicket Modal — Feature 1: non-striker support + Feature 7: dismissal types */}
      <Modal open={showWicketModal} onClose={() => { setShowWicketModal(false); setIsWicket(false) }} title="Select Dismissal">
        <div className="space-y-4">
          {/* Feature 1: who is dismissed */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Who is dismissed?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDismissedIsNonStriker(false) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                  !dismissedIsNonStriker
                    ? 'border-red-500 bg-red-600 text-white'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                }`}>
                ⚡ Striker
                {strikerId && (() => {
                  const p = battingPlayers.find(x => x.id === strikerId)
                  return p ? <span className="block text-xs font-normal opacity-80 truncate">{(p as any).full_name || (p as any).username}</span> : null
                })()}
              </button>
              <button
                onClick={() => { setDismissedIsNonStriker(true) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                  dismissedIsNonStriker
                    ? 'border-red-500 bg-red-600 text-white'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                }`}>
                🏃 Non-Striker
                {nonStrikerId && (() => {
                  const p = battingPlayers.find(x => x.id === nonStrikerId)
                  return p ? <span className="block text-xs font-normal opacity-80 truncate">{(p as any).full_name || (p as any).username}</span> : null
                })()}
              </button>
            </div>
          </div>

          {/* Dismissal types — filter based on who is dismissed */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Dismissal Type</p>
            <div className="grid grid-cols-2 gap-2">
              {DISMISSALS
                .filter(d => {
                  // Non-striker can only be: run_out, obstructing_field, retired_hurt
                  if (dismissedIsNonStriker) return ['run_out', 'obstructing_field', 'retired_hurt', 'timed_out'].includes(d)
                  return true
                })
                .map(d => (
                  <button key={d}
                    onClick={() => { setDismissal(d); setShowWicketModal(false) }}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                      dismissal === d
                        ? 'border-red-500 bg-red-600 text-white'
                        : 'border-slate-300 text-slate-700 hover:border-red-400 hover:bg-red-50 bg-white'
                    }`}>
                    {d.replace(/_/g, ' ')}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Previous innings */}
      {liveData && liveData.innings_history.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-slate-900 mb-3">Previous Innings</h3>
          {liveData.innings_history.map(inn => (
            <div key={inn.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <div className="text-sm font-medium text-slate-700">{inn.batting_team?.name}</div>
                <div className="text-xs text-slate-500">Innings {inn.innings_number}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{inn.total_runs}/{inn.total_wickets}</div>
                <div className="text-xs text-slate-500">({formatOvers(inn.total_overs)} ov)</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

