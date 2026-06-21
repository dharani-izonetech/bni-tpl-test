/**
 * Match Setup Wizard + Live Scoring — CricHeroes-style flow
 * Step 1: Select 2 teams
 * Step 2: Select 11 players per team
 * Step 3: Select overs
 * Step 4: Coin toss animation
 * Step 5: Live ball-by-ball scoring
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi, matchesApi, scoringApi } from '@/api/services'
import { Spinner } from '@/components/common'
import toast from 'react-hot-toast'
import type { PlayerProfile } from '@/types'

type Step = 'teams' | 'players' | 'overs' | 'toss' | 'scoring'

interface BallRecord {
  over: number
  ball: number
  runs: number
  extras: number
  extraType: string
  isWicket: boolean
  batsmanRuns: number
}

export default function MatchSetupWizard() {
  const qc = useQueryClient()
  const [step, setStep] = useState<Step>('teams')

  // Step 1: Teams
  const [team1Id, setTeam1Id] = useState('')
  const [team2Id, setTeam2Id] = useState('')

  // Step 2: Playing XI
  const [team1XI, setTeam1XI] = useState<number[]>([])
  const [team2XI, setTeam2XI] = useState<number[]>([])
  const [selectingTeam, setSelectingTeam] = useState<1 | 2>(1)

  // Step 3: Overs
  const [overs, setOvers] = useState(6)

  // Step 4: Toss
  const [tossWinner, setTossWinner] = useState<1 | 2 | null>(null)
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat')
  const [coinFlipping, setCoinFlipping] = useState(false)

  // Step 5: Scoring state
  const [matchId, setMatchId] = useState<string | null>(null)
  const [inningsId, setInningsId] = useState<number | null>(null)
  const [strikerId, setStrikerId] = useState<number | null>(null)
  const [nonStrikerId, setNonStrikerId] = useState<number | null>(null)
  const [bowlerId, setBowlerId] = useState<number | null>(null)
  const [totalRuns, setTotalRuns] = useState(0)
  const [totalWickets, setTotalWickets] = useState(0)
  const [totalBalls, setTotalBalls] = useState(0)
  const [ballLog, setBallLog] = useState<BallRecord[]>([])
  const [currentInnings, setCurrentInnings] = useState(1)
  const [showWicketModal, setShowWicketModal] = useState(false)
  const [pendingWicketRuns, setPendingWicketRuns] = useState(0)

  // Queries
  const { data: teams = [] } = useQuery({
    queryKey: ['all-teams'],
    queryFn: () => teamsApi.list(),
  })

  const { data: team1Players = [], isLoading: t1Loading } = useQuery({
    queryKey: ['team-players', team1Id],
    queryFn: () => teamsApi.getPlayers(team1Id),
    enabled: !!team1Id,
  })

  const { data: team2Players = [], isLoading: t2Loading } = useQuery({
    queryKey: ['team-players', team2Id],
    queryFn: () => teamsApi.getPlayers(team2Id),
    enabled: !!team2Id,
  })

  const team1 = (teams as any[]).find((t: any) => String(t.id) === team1Id)
  const team2 = (teams as any[]).find((t: any) => String(t.id) === team2Id)

  // Batting/bowling team based on toss
  const battingTeamPlayers = (() => {
    if (!tossWinner) return []
    const battingTeamId = tossDecision === 'bat'
      ? (tossWinner === 1 ? team1Id : team2Id)
      : (tossWinner === 1 ? team2Id : team1Id)
    const battingXI = battingTeamId === team1Id ? team1XI : team2XI
    const allPlayers = battingTeamId === team1Id ? team1Players : team2Players
    return (allPlayers as PlayerProfile[]).filter(p => battingXI.includes(p.id))
  })()

  const bowlingTeamPlayers = (() => {
    if (!tossWinner) return []
    const bowlingTeamId = tossDecision === 'bat'
      ? (tossWinner === 1 ? team2Id : team1Id)
      : (tossWinner === 1 ? team1Id : team2Id)
    const bowlingXI = bowlingTeamId === team1Id ? team1XI : team2XI
    const allPlayers = bowlingTeamId === team1Id ? team1Players : team2Players
    return (allPlayers as PlayerProfile[]).filter(p => bowlingXI.includes(p.id))
  })()

  // Create match + persist Playing XI + start innings
  const createMatch = useMutation({
    mutationFn: async () => {
      // 1. Create match
      const m = await matchesApi.create({
        team1_id: team1Id,
        team2_id: team2Id,
        overs,
        match_type: 'league',
      } as any)

      // 2. Persist Playing XI for both teams (best-effort — don't block match start)
      await Promise.allSettled([
        matchesApi.setPlayingXI(m.id, { team_id: team1Id, player_ids: team1XI }),
        matchesApi.setPlayingXI(m.id, { team_id: team2Id, player_ids: team2XI }),
      ])

      // 3. Record toss
      const tossWinnerTeamId = tossWinner === 1 ? team1Id : team2Id
      await matchesApi.recordToss(m.id, { toss_winner_id: tossWinnerTeamId, toss_decision: tossDecision })

      // 4. Start innings
      const innings = await matchesApi.startInnings(m.id)
      return { matchId: m.id, inningsId: innings.id }
    },
    onSuccess: (data) => {
      setMatchId(data.matchId)
      setInningsId(data.inningsId)
      setStep('scoring')
      toast.success('Match started! Select striker, non-striker & bowler.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Failed to start match'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  // Record ball - called directly in handleRecordBall via scoringApi

  // Ball recording handler
  const handleRecordBall = (runs: number, extraType: string = '', isWicket: boolean = false, dismissalType: string = '') => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error('Select striker, non-striker and bowler first')
      return
    }

    const overNum = Math.floor(totalBalls / 6)
    const ballInOver = totalBalls % 6
    const isLegalDelivery = extraType !== 'wide' && extraType !== 'no_ball'

    // Record to backend (fire and forget — don't block UI)
    if (inningsId) {
      scoringApi.recordBall(inningsId, {
        batsman_id: strikerId,
        bowler_id: bowlerId,
        non_striker_id: nonStrikerId,
        runs_off_bat: extraType ? 0 : runs,
        extra_runs: extraType ? runs : 0,
        ball_type: extraType || 'normal',
        is_wicket: isWicket,
        dismissal_type: isWicket ? dismissalType || 'bowled' : undefined,
        dismissed_player_id: isWicket ? strikerId : undefined,
        is_free_hit: false,
      }).catch(() => { /* local state is already updated */ })
    }

    // Update local state immediately
    const extraRun = (extraType === 'wide' || extraType === 'no_ball') ? 1 : 0
    const totalBallRuns = runs + extraRun
    const newBalls = isLegalDelivery ? totalBalls + 1 : totalBalls

    setTotalRuns(prev => prev + totalBallRuns)
    setTotalBalls(newBalls)

    if (isWicket) {
      setTotalWickets(prev => prev + 1)
      setStrikerId(null) // Need to select new batsman
      toast('Wicket! Select new batsman.', { icon: '🔴' })
    } else {
      // Show what was scored
      const label = extraType ? `${extraType} +${runs}` : runs === 4 ? 'FOUR!' : runs === 6 ? 'SIX!' : `${runs} run${runs !== 1 ? 's' : ''}`
      toast(label, { icon: runs === 6 ? '💥' : runs === 4 ? '🔵' : '✓', duration: 1000 })
    }

    // Rotate strike on odd runs (only if not wicket)
    if (!isWicket && runs % 2 === 1) {
      const temp = strikerId
      setStrikerId(nonStrikerId)
      setNonStrikerId(temp)
    }

    // End of over — rotate strike + need new bowler (only on legal deliveries)
    if (isLegalDelivery && newBalls % 6 === 0 && newBalls > 0) {
      if (!isWicket) {
        const temp = strikerId
        setStrikerId(nonStrikerId)
        setNonStrikerId(temp)
      }
      setBowlerId(null) // Need to select new bowler
      toast('Over completed! Select new bowler.', { icon: '🏏' })
    }

    setBallLog(prev => [...prev, {
      over: overNum,
      ball: ballInOver + 1,
      runs: totalBallRuns,
      extras: extraRun,
      extraType,
      isWicket,
      batsmanRuns: extraType ? 0 : runs,
    }])
  }

  // Wicket with dismissal type
  const handleWicketClick = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error('Select striker, non-striker and bowler first')
      return
    }
    setShowWicketModal(true)
  }

  const confirmWicket = (dismissalType: string) => {
    setShowWicketModal(false)
    handleRecordBall(pendingWicketRuns, '', true, dismissalType)
    setPendingWicketRuns(0)
  }

  const currentOver = Math.floor(totalBalls / 6)
  const ballsInOver = totalBalls % 6
  const oversDisplay = `${currentOver}.${ballsInOver}`
  const playerLabel = (p: PlayerProfile) => (p as any).full_name || (p as any).username || `Player #${p.id}`

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1">
        {(['teams', 'players', 'overs', 'toss', 'scoring'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step === s ? 'bg-primary-600 text-white' : i < ['teams', 'players', 'overs', 'toss', 'scoring'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>{i + 1}</div>
            {i < 4 && <div className={`h-0.5 w-6 ${i < ['teams', 'players', 'overs', 'toss', 'scoring'].indexOf(step) ? 'bg-green-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: SELECT TEAMS ── */}
      {step === 'teams' && (
        <div className="card space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Step 1: Select Teams</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Team 1</label>
              <select value={team1Id} onChange={e => setTeam1Id(e.target.value)}
                className="input w-full">
                <option value="">— Select Team 1 —</option>
                {(teams as any[]).map((t: any) => (
                  <option key={t.id} value={String(t.id)} disabled={String(t.id) === team2Id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Team 2</label>
              <select value={team2Id} onChange={e => setTeam2Id(e.target.value)}
                className="input w-full">
                <option value="">— Select Team 2 —</option>
                {(teams as any[]).map((t: any) => (
                  <option key={t.id} value={String(t.id)} disabled={String(t.id) === team1Id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={() => setStep('players')} disabled={!team1Id || !team2Id}
            className="btn-primary w-full py-3">
            Next → Select Players
          </button>
        </div>
      )}

      {/* ── STEP 2: SELECT PLAYING XI ── */}
      {step === 'players' && (
        <div className="card space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Step 2: Select Playing XI</h2>

          {/* Toggle between teams */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button onClick={() => setSelectingTeam(1)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${selectingTeam === 1 ? 'bg-white shadow text-primary-700' : 'text-slate-500'}`}>
              {team1?.name || 'Team 1'}
              <span className={`ml-1.5 text-xs ${team1XI.length === 11 ? 'text-green-600' : 'text-slate-400'}`}>
                ({team1XI.length}/11)
              </span>
            </button>
            <button onClick={() => setSelectingTeam(2)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${selectingTeam === 2 ? 'bg-white shadow text-primary-700' : 'text-slate-500'}`}>
              {team2?.name || 'Team 2'}
              <span className={`ml-1.5 text-xs ${team2XI.length === 11 ? 'text-green-600' : 'text-slate-400'}`}>
                ({team2XI.length}/11)
              </span>
            </button>
          </div>

          {/* Player list */}
          {(() => {
            const players: any[] = selectingTeam === 1 ? team1Players : team2Players
            const loading = selectingTeam === 1 ? t1Loading : t2Loading
            const xi = selectingTeam === 1 ? team1XI : team2XI
            const setXI = selectingTeam === 1 ? setTeam1XI : setTeam2XI

            // Sort by jersey number numerically; nulls last
            const sorted = [...players].sort((a, b) => {
              const na = a.jersey_number ?? Infinity
              const nb = b.jersey_number ?? Infinity
              return na - nb
            })

            // Flag duplicate jersey numbers so admin can spot data issues
            const jerseyCount: Record<number, number> = {}
            sorted.forEach(p => {
              if (p.jersey_number) jerseyCount[p.jersey_number] = (jerseyCount[p.jersey_number] ?? 0) + 1
            })

            return loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : sorted.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No players found for this team.<br />
                <span className="text-xs">Add players via the Players admin panel first.</span>
              </div>
            ) : (
              <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <div className="w-9 text-center">#</div>
                  <div className="flex-1">Player</div>
                  <div className="w-16 text-right">{xi.length}/11</div>
                </div>

                {sorted.map((p: any, idx: number) => {
                  const isSelected = xi.includes(p.id)
                  const isFull = xi.length >= 11
                  const isDupJersey = p.jersey_number && jerseyCount[p.jersey_number] > 1
                  const displayName = p.full_name || p.username || `Player #${p.id}`

                  return (
                    <label key={p.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                        : isFull
                        ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isSelected && isFull}
                        onChange={e => {
                          if (e.target.checked) setXI(prev => [...prev, p.id])
                          else setXI(prev => prev.filter(id => id !== p.id))
                        }}
                        className="h-4 w-4 accent-primary-600 shrink-0"
                      />

                      {/* Sequential number + jersey number stacked */}
                      <div className="flex shrink-0 flex-col items-center gap-0.5 w-10">
                        {/* Row index: 1, 2, 3 … */}
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {idx + 1}
                        </div>
                        {/* Jersey number */}
                        <span className={`text-[10px] font-semibold leading-none ${
                          isDupJersey ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {p.jersey_number != null ? `#${p.jersey_number}` : '—'}
                        </span>
                      </div>

                      {/* Name + role */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-800' : 'text-slate-900'}`}>
                            {displayName}
                          </span>
                          {p.is_captain && (
                            <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">C</span>
                          )}
                          {p.is_wicket_keeper && (
                            <span className="shrink-0 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">WK</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {p.player_role || 'Player'}
                          {p.batting_style ? ` · ${p.batting_style}` : ''}
                          {isDupJersey && (
                            <span className="ml-1 text-red-400 font-medium">· duplicate jersey</span>
                          )}
                        </div>
                      </div>

                      {/* Selected checkmark */}
                      {isSelected && (
                        <svg className="h-5 w-5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  )
                })}
              </div>
            )
          })()}

          <div className="flex gap-3">
            <button onClick={() => setStep('teams')} className="btn-secondary flex-1">← Back</button>
            <button onClick={() => setStep('overs')} disabled={team1XI.length !== 11 || team2XI.length !== 11}
              className="btn-primary flex-1">
              Next → Set Overs
            </button>
          </div>
          {(team1XI.length !== 11 || team2XI.length !== 11) && (
            <p className="text-center text-xs text-amber-600">Select exactly 11 players for each team</p>
          )}
        </div>
      )}

      {/* ── STEP 3: OVERS ── */}
      {step === 'overs' && (
        <div className="card space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Step 3: Number of Overs</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[6, 8].map(o => (
              <button key={o} onClick={() => setOvers(o)}
                className={`h-14 w-14 rounded-xl border-2 text-lg font-bold transition ${
                  overs === o ? 'border-primary-500 bg-primary-600 text-white' : 'border-slate-300 text-slate-700 hover:border-primary-400'
                }`}>
                {o}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500">Selected: <span className="font-bold text-primary-700">{overs} overs</span> per innings</p>
          <div className="flex gap-3">
            <button onClick={() => setStep('players')} className="btn-secondary flex-1">← Back</button>
            <button onClick={() => setStep('toss')} className="btn-primary flex-1">
              Next → Coin Toss 🪙
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: COIN TOSS ── */}
      {step === 'toss' && (
        <div className="card space-y-5 text-center">
          <h2 className="text-xl font-bold text-slate-900">Step 4: Coin Toss 🪙</h2>

          {!tossWinner ? (
            <>
              <div className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-200 to-amber-500 text-5xl shadow-lg ${coinFlipping ? 'animate-spin' : ''}`}>
                🪙
              </div>
              <p className="text-sm text-slate-500">Click a team to win the toss</p>
              <div className="flex gap-3">
                <button onClick={() => { setCoinFlipping(true); setTimeout(() => { setCoinFlipping(false); setTossWinner(1) }, 1500) }}
                  disabled={coinFlipping}
                  className="flex-1 rounded-xl border-2 border-slate-300 py-4 text-sm font-bold text-slate-900 hover:border-primary-400 hover:bg-primary-50 transition">
                  {team1?.name || 'Team 1'}
                </button>
                <button onClick={() => { setCoinFlipping(true); setTimeout(() => { setCoinFlipping(false); setTossWinner(2) }, 1500) }}
                  disabled={coinFlipping}
                  className="flex-1 rounded-xl border-2 border-slate-300 py-4 text-sm font-bold text-slate-900 hover:border-primary-400 hover:bg-primary-50 transition">
                  {team2?.name || 'Team 2'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-4xl">🎉</div>
              <p className="text-lg font-bold text-slate-900">
                {tossWinner === 1 ? team1?.name : team2?.name} won the toss!
              </p>
              <p className="text-sm text-slate-500">Choose to:</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setTossDecision('bat')}
                  className={`rounded-xl border-2 px-8 py-3 text-sm font-bold transition ${
                    tossDecision === 'bat' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-600'
                  }`}>🏏 Bat</button>
                <button onClick={() => setTossDecision('bowl')}
                  className={`rounded-xl border-2 px-8 py-3 text-sm font-bold transition ${
                    tossDecision === 'bowl' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-600'
                  }`}>🎳 Bowl</button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setTossWinner(null); setCoinFlipping(false) }} className="btn-secondary flex-1">← Redo Toss</button>
                <button onClick={() => createMatch.mutate()} disabled={createMatch.isPending}
                  className="btn-primary flex-1">
                  {createMatch.isPending ? <Spinner size="sm" /> : '▶ Start Match'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 5: LIVE SCORING ── */}
      {step === 'scoring' && (
        <div className="space-y-4">
          {/* Scoreboard */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white shadow-lg">
            <div className="text-center">
              <div className="text-5xl font-bold">{totalRuns}/{totalWickets}</div>
              <div className="mt-1 text-lg text-primary-200">({oversDisplay}/{overs} ov)</div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-primary-900/40 overflow-hidden">
              <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${Math.min((totalBalls / (overs * 6)) * 100, 100)}%` }} />
            </div>
          </div>

          {/* Player Selection */}
          <div className="card space-y-3">
            <h3 className="font-bold text-slate-900">Select Players</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-primary-700 mb-1">⚡ Striker</label>
                <select value={strikerId ?? ''} onChange={e => setStrikerId(e.target.value ? Number(e.target.value) : null)} className="input text-sm w-full">
                  <option value="">— Select —</option>
                  {battingTeamPlayers.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === nonStrikerId}>{playerLabel(p)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">🏃 Non-Striker</label>
                <select value={nonStrikerId ?? ''} onChange={e => setNonStrikerId(e.target.value ? Number(e.target.value) : null)} className="input text-sm w-full">
                  <option value="">— Select —</option>
                  {battingTeamPlayers.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === strikerId}>{playerLabel(p)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">🎳 Bowler</label>
                <select value={bowlerId ?? ''} onChange={e => setBowlerId(e.target.value ? Number(e.target.value) : null)} className="input text-sm w-full">
                  <option value="">— Select —</option>
                  {bowlingTeamPlayers.map(p => (
                    <option key={p.id} value={p.id}>{playerLabel(p)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scoring Buttons */}
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-900">Score This Ball</h3>

            {/* Runs */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Runs</p>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6].map(r => (
                  <button key={r} onClick={() => handleRecordBall(r)}
                    disabled={!strikerId || !nonStrikerId || !bowlerId}
                    className={`h-12 w-12 rounded-xl text-lg font-bold border-2 transition ${
                      r === 4 ? 'border-blue-400 text-blue-700 hover:bg-blue-50' :
                      r === 6 ? 'border-purple-400 text-purple-700 hover:bg-purple-50' :
                      'border-slate-300 text-slate-700 hover:border-primary-400 hover:bg-primary-50'
                    } disabled:opacity-40`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Extras</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleRecordBall(1, 'wide')}
                  disabled={!strikerId || !nonStrikerId || !bowlerId}
                  className="rounded-lg border-2 border-yellow-400 px-4 py-2 text-sm font-bold text-yellow-700 hover:bg-yellow-50 disabled:opacity-40">
                  Wide
                </button>
                <button onClick={() => handleRecordBall(1, 'no_ball')}
                  disabled={!strikerId || !nonStrikerId || !bowlerId}
                  className="rounded-lg border-2 border-orange-400 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-40">
                  No Ball
                </button>
                <button onClick={() => handleRecordBall(1, 'bye')}
                  disabled={!strikerId || !nonStrikerId || !bowlerId}
                  className="rounded-lg border-2 border-slate-400 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  Bye
                </button>
                <button onClick={() => handleRecordBall(1, 'leg_bye')}
                  disabled={!strikerId || !nonStrikerId || !bowlerId}
                  className="rounded-lg border-2 border-slate-400 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  Leg Bye
                </button>
              </div>
            </div>

            {/* Wicket */}
            <div>
              <button onClick={handleWicketClick}
                disabled={!strikerId || !nonStrikerId || !bowlerId}
                className="rounded-lg border-2 border-red-500 bg-red-50 px-6 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-40">
                🔴 Wicket
              </button>
            </div>
          </div>

          {/* Wicket Type Modal */}
          {showWicketModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 mb-4">🔴 Wicket Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'bowled', label: '🏏 Bowled' },
                    { key: 'caught', label: '🤚 Caught' },
                    { key: 'lbw', label: '🦵 LBW' },
                    { key: 'run_out', label: '🏃 Run Out' },
                    { key: 'stumped', label: '🧤 Stumped' },
                    { key: 'hit_wicket', label: '💥 Hit Wicket' },
                    { key: 'retired_hurt', label: '🤕 Retired Hurt' },
                  ].map(d => (
                    <button key={d.key} onClick={() => confirmWicket(d.key)}
                      className="rounded-lg border-2 border-red-200 px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 hover:border-red-400 transition">
                      {d.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowWicketModal(false)}
                  className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* This Over */}
          {ballLog.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold text-slate-500 mb-2">This Over ({currentOver}.{ballsInOver})</p>
              <div className="flex gap-2 flex-wrap">
                {ballLog.slice(-6).map((b, i) => (
                  <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border ${
                    b.isWicket ? 'bg-red-600 text-white border-red-600' :
                    b.batsmanRuns === 4 ? 'bg-blue-500 text-white border-blue-500' :
                    b.batsmanRuns === 6 ? 'bg-purple-500 text-white border-purple-500' :
                    b.extraType ? 'bg-yellow-400 text-black border-yellow-400' :
                    'bg-slate-700 text-white border-slate-700'
                  }`}>
                    {b.isWicket ? 'W' : b.extraType ? b.extraType[0].toUpperCase() : b.runs}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Innings complete check */}
          {totalBalls >= overs * 6 && (
            <div className="card bg-green-50 border-green-200 text-center py-6">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-green-800">Innings Complete!</h3>
              <p className="text-green-600">{totalRuns}/{totalWickets} ({oversDisplay} ov)</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
