/**
 * Team Allocation Spinner — Slot-Based Tournament Group Assignment
 * ─────────────────────────────────────────────────────────────────────────────
 * 20 Teams → 20 Slots (A-T) → 5 Groups of 4
 * Group 1: A,B,C,D | Group 2: E,F,G,H | Group 3: I,J,K,L | Group 4: M,N,O,P | Group 5: Q,R,S,T
 * 
 * Flow: Admin enters team name → Spin → Random slot assigned → Group identified → Matches generated
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import SEO from '@/components/SEO'

// ── Constants ────────────────────────────────────────────────────────────────
const ALL_SLOTS = 'ABCDEFGHIJKLMNOPQRST'.split('')
const GROUPS: Record<number, string[]> = {
  1: ['A', 'B', 'C', 'D'],
  2: ['E', 'F', 'G', 'H'],
  3: ['I', 'J', 'K', 'L'],
  4: ['M', 'N', 'O', 'P'],
  5: ['Q', 'R', 'S', 'T'],
}

function getGroupForSlot(slot: string): number {
  for (const [group, slots] of Object.entries(GROUPS)) {
    if (slots.includes(slot)) return Number(group)
  }
  return 0
}

function getGroupSlots(groupNum: number): string[] {
  return GROUPS[groupNum] ?? []
}

// Match numbering: Group 1 = 1-6, Group 2 = 7-12, etc.
function getMatchNumber(groupNum: number, matchIdx: number): number {
  return (groupNum - 1) * 6 + matchIdx + 1
}

interface SlotAssignment {
  teamName: string
  slot: string
  groupNumber: number
}

interface ScheduledMatch {
  matchNumber: number
  groupNumber: number
  team1Slot: string
  team2Slot: string
  team1Name: string
  team2Name: string
}

// ── Spinner Wheel Component ─────────────────────────────────────────────────
function SpinnerWheel({ isSpinning, selectedSlot, availableSlots }: {
  isSpinning: boolean
  selectedSlot: string | null
  availableSlots: string[]
}) {
  const [visibleIdx, setVisibleIdx] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isSpinning) {
      let speed = 60
      const tick = () => {
        setVisibleIdx(prev => (prev + 1) % ALL_SLOTS.length)
        speed = Math.min(speed + 3, 350)
        intervalRef.current = window.setTimeout(tick, speed)
      }
      intervalRef.current = window.setTimeout(tick, speed)
    } else {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }
      if (selectedSlot) {
        const idx = ALL_SLOTS.indexOf(selectedSlot)
        if (idx >= 0) setVisibleIdx(idx)
      }
    }
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current) }
  }, [isSpinning, selectedSlot])

  const currentSlot = ALL_SLOTS[visibleIdx % ALL_SLOTS.length] ?? '?'
  const isAvailable = availableSlots.includes(currentSlot)

  return (
    <div className="relative h-[72px] overflow-hidden rounded-xl border-2 border-[rgba(166,124,0,0.5)] bg-[linear-gradient(135deg,rgba(240,232,208,0.96),rgba(240,192,64,0.5),rgba(166,124,0,0.3))] shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-[#FDF8E8] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t from-[#FDF8E8] to-transparent" />
      <div className="flex h-full items-center justify-center">
        <span className={`font-heading text-4xl font-black tracking-wider transition-all duration-150 ${
          isSpinning ? 'text-[#A67C00] animate-pulse' : selectedSlot ? 'text-[#1A1200] scale-110' : 'text-[#A67C00]'
        } ${!isSpinning && !isAvailable && !selectedSlot ? 'opacity-40 line-through' : ''}`}>
          Team {currentSlot}
        </span>
      </div>
    </div>
  )
}

// ── Match Reveal Card ───────────────────────────────────────────────────────
function MatchRevealCard({ match, animDelay }: { match: ScheduledMatch; animDelay: number }) {
  return (
    <div
      className="rounded-xl border border-[rgba(166,124,0,0.4)] bg-[linear-gradient(135deg,rgba(240,232,208,0.92),rgba(240,192,64,0.55))] px-5 py-4 shadow-[0_4px_16px_rgba(28,22,0,0.15)] animate-fade-up"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="flex items-center justify-center gap-3">
        <span className="shrink-0 rounded-md bg-[rgba(166,124,0,0.15)] px-2 py-0.5 font-heading text-xs font-bold uppercase tracking-wider text-[#5C4A10]">
          Match {match.matchNumber}:
        </span>
        <span className="font-heading text-base font-bold text-[#1A1200] sm:text-lg">
          {match.team1Name}
        </span>
        <span className="font-heading text-sm font-black text-[#A67C00] uppercase">VS</span>
        <span className="font-heading text-base font-bold text-[#1A1200] sm:text-lg">
          {match.team2Name}
        </span>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TeamAllocationSpinner() {
  const [teamName, setTeamName] = useState('')
  const [assignments, setAssignments] = useState<SlotAssignment[]>([])
  const [fixtures, setFixtures] = useState<ScheduledMatch[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([...ALL_SLOTS])
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastAssignment, setLastAssignment] = useState<SlotAssignment | null>(null)
  const [lastMatches, setLastMatches] = useState<ScheduledMatch[]>([])
  const [showReveal, setShowReveal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ── Load existing state from backend ────────────────────────────────────
  useEffect(() => {
    loadState()
  }, [])

  const loadState = async () => {
    try {
      const res = await apiFetch<{ data: { slot_to_team_name?: (string | null)[]; schedule_plan?: any[]; revealed_count?: number } | null }>('/schedule-snapshot')
      if (res.data && res.data.slot_to_team_name) {
        const slotNames = res.data.slot_to_team_name
        // Rebuild assignments from slot_to_team_name array
        const loadedAssignments: SlotAssignment[] = []
        slotNames.forEach((name, idx) => {
          if (name) {
            const slot = ALL_SLOTS[idx]
            loadedAssignments.push({
              teamName: name,
              slot,
              groupNumber: getGroupForSlot(slot),
            })
          }
        })
        if (loadedAssignments.length > 0) {
          setAssignments(loadedAssignments)
          setAvailableSlots(ALL_SLOTS.filter(s => !loadedAssignments.find(a => a.slot === s)))

          // Rebuild fixtures from assignments
          const allFixtures: ScheduledMatch[] = []
          for (let g = 1; g <= 5; g++) {
            const groupAssignments = loadedAssignments.filter(a => a.groupNumber === g)
            let matchIdx = 0
            for (let i = 0; i < groupAssignments.length; i++) {
              for (let j = i + 1; j < groupAssignments.length; j++) {
                allFixtures.push({
                  matchNumber: getMatchNumber(g, matchIdx),
                  groupNumber: g,
                  team1Slot: groupAssignments[i].slot,
                  team2Slot: groupAssignments[j].slot,
                  team1Name: groupAssignments[i].teamName,
                  team2Name: groupAssignments[j].teamName,
                })
                matchIdx++
              }
            }
          }
          setFixtures(allFixtures)
        }
      }
    } catch { /* fresh state */ }
    setIsLoading(false)
  }

  // ── Save state to backend ──────────────────────────────────────────────
  const saveState = async (newAssignments: SlotAssignment[], newFixtures: ScheduledMatch[]) => {
    try {
      // Build slotToTeamName as array of 20 entries (index = slot position A=0, B=1, ... T=19)
      const slotToTeamName: (string | null)[] = ALL_SLOTS.map(slot => {
        const assignment = newAssignments.find(a => a.slot === slot)
        return assignment ? assignment.teamName : null
      })

      // Build schedule_plan in the format GroupsSection expects
      const schedulePlan = newFixtures.map((f, idx) => ({
        slot: f.matchNumber,
        team1: ALL_SLOTS.indexOf(f.team1Slot),
        team2: ALL_SLOTS.indexOf(f.team2Slot),
      }))

      await apiFetch('/schedule-snapshot', {
        method: 'POST',
        body: JSON.stringify({
          slot_to_team_name: slotToTeamName,
          schedule_plan: schedulePlan,
          revealed_count: newAssignments.length,
          is_active: true,
        }),
      })
    } catch (err) {
      console.warn('Failed to save state:', err)
    }
  }

  // ── Spin Logic ─────────────────────────────────────────────────────────
  const handleSpin = useCallback(() => {
    if (!teamName.trim()) return
    if (availableSlots.length === 0) return
    if (isSpinning) return
    // Check duplicate team name
    if (assignments.find(a => a.teamName.toLowerCase() === teamName.trim().toLowerCase())) {
      alert('This team has already been assigned a slot!')
      return
    }

    setIsSpinning(true)
    setShowReveal(false)
    setLastAssignment(null)
    setLastMatches([])

    // Play spin tick sound using Web Audio API
    let audioCtx: AudioContext | null = null
    let tickInterval: number | null = null
    try {
      audioCtx = new AudioContext()
      let tickSpeed = 80
      const playTick = () => {
        if (!audioCtx) return
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.frequency.value = 800 + Math.random() * 400
        osc.type = 'sine'
        gain.gain.value = 0.15
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.05)
        tickSpeed = Math.min(tickSpeed + 4, 300)
        tickInterval = window.setTimeout(playTick, tickSpeed)
      }
      tickInterval = window.setTimeout(playTick, tickSpeed)
    } catch { /* no audio support */ }

    // Random selection after spin duration
    const spinDuration = 2000 + Math.random() * 1500

    setTimeout(() => {
      // Pick random available slot
      const randomIdx = Math.floor(Math.random() * availableSlots.length)
      const selectedSlot = availableSlots[randomIdx]
      const groupNum = getGroupForSlot(selectedSlot)

      // Create assignment
      const newAssignment: SlotAssignment = {
        teamName: teamName.trim(),
        slot: selectedSlot,
        groupNumber: groupNum,
      }

      // Generate matches against other teams in the same group
      const groupSlots = getGroupSlots(groupNum)
      const otherSlotsInGroup = groupSlots.filter(s => s !== selectedSlot)
      const newMatches: ScheduledMatch[] = otherSlotsInGroup.map((otherSlot, idx) => {
        const otherTeam = assignments.find(a => a.slot === otherSlot)
        return {
          matchNumber: getMatchNumber(groupNum, idx + (assignments.filter(a => a.groupNumber === groupNum).length * 3)),
          groupNumber: groupNum,
          team1Slot: selectedSlot,
          team2Slot: otherSlot,
          team1Name: teamName.trim(),
          team2Name: otherTeam?.teamName ?? `Team ${otherSlot}`,
        }
      })

      // Recalculate all fixtures for the group (full round-robin among assigned teams)
      const allGroupAssignments = [...assignments.filter(a => a.groupNumber === groupNum), newAssignment]
      const fullGroupFixtures: ScheduledMatch[] = []
      let matchIdx = 0
      for (let i = 0; i < allGroupAssignments.length; i++) {
        for (let j = i + 1; j < allGroupAssignments.length; j++) {
          fullGroupFixtures.push({
            matchNumber: getMatchNumber(groupNum, matchIdx),
            groupNumber: groupNum,
            team1Slot: allGroupAssignments[i].slot,
            team2Slot: allGroupAssignments[j].slot,
            team1Name: allGroupAssignments[i].teamName,
            team2Name: allGroupAssignments[j].teamName,
          })
          matchIdx++
        }
      }

      // Update state
      const updatedAssignments = [...assignments, newAssignment]
      const otherGroupFixtures = fixtures.filter(f => f.groupNumber !== groupNum)
      const updatedFixtures = [...otherGroupFixtures, ...fullGroupFixtures]

      setAssignments(updatedAssignments)
      setFixtures(updatedFixtures)
      setAvailableSlots(prev => prev.filter(s => s !== selectedSlot))
      setLastAssignment(newAssignment)
      setLastMatches(newMatches)
      setIsSpinning(false)
      setShowReveal(true)
      setTeamName('')

      // Stop audio
      if (tickInterval) { clearTimeout(tickInterval); tickInterval = null }
      if (audioCtx) {
        // Play success chime
        try {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.frequency.value = 1200
          osc.type = 'sine'
          gain.gain.value = 0.3
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)
          osc.start()
          osc.stop(audioCtx.currentTime + 0.4)
        } catch { /* ignore */ }
        setTimeout(() => { audioCtx?.close(); audioCtx = null }, 500)
      }

      // Save to backend
      void saveState(updatedAssignments, updatedFixtures)
    }, spinDuration)
  }, [teamName, availableSlots, isSpinning, assignments, fixtures])

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (!confirm('Reset all slot assignments? This cannot be undone.')) return
    setAssignments([])
    setFixtures([])
    setAvailableSlots([...ALL_SLOTS])
    setLastAssignment(null)
    setLastMatches([])
    setShowReveal(false)
    void saveState([], [])
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(166,124,0,0.3)] border-t-[#A67C00]" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#FFFDF5,#FFF8E8,#F0E8D0)] px-4 py-8">
      <SEO title="Cricket Match Scheduler" description="BNI Cricket Tournament Team Allocation Spinner — assign teams to groups via random slot selection." />

      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-center font-heading text-3xl font-bold uppercase tracking-wide text-[#1A1200] md:text-4xl">
          Cricket Match Scheduler
        </h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Left: Team Assignment Spinner ── */}
          <div className="rounded-2xl border border-[rgba(166,124,0,0.3)] bg-[rgba(255,253,245,0.95)] p-5 shadow-[0_8px_32px_rgba(28,22,0,0.08)]">
            <h2 className="mb-4 font-heading text-xl font-bold text-[#1A1200]">Team Assignment Spinner</h2>

            {/* Progress */}
            <div className="mb-4 flex items-center justify-between rounded-lg border border-[rgba(166,124,0,0.2)] bg-[rgba(240,232,208,0.5)] px-4 py-2">
              <span className="text-sm font-semibold text-[#1A1200]">
                Assigned Slots: {assignments.length}/20
              </span>
              <span className="text-sm text-[#5C4A10]">
                Remaining: {availableSlots.length}
              </span>
            </div>

            {/* Team Name Input */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5C4A10]">
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSpin()}
                placeholder="Type team name and press Enter"
                disabled={availableSlots.length === 0 || isSpinning}
                className="w-full rounded-lg border border-[rgba(166,124,0,0.3)] bg-white px-4 py-2.5 text-sm text-[#1A1200] placeholder-[#A67C00]/50 focus:border-[#A67C00] focus:outline-none focus:ring-2 focus:ring-[rgba(166,124,0,0.2)] disabled:opacity-50"
              />
            </div>

            {/* Buttons */}
            <div className="mb-5 flex gap-3">
              <button
                onClick={handleSpin}
                disabled={!teamName.trim() || availableSlots.length === 0 || isSpinning}
                className="rounded-lg bg-[linear-gradient(135deg,#A67C00,#F0C040)] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-[#1A1200] shadow-[0_4px_12px_rgba(166,124,0,0.3)] transition hover:shadow-[0_6px_16px_rgba(166,124,0,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSpinning ? '🎰 Spinning...' : 'Assign Slot'}
              </button>
              {/* <button
                onClick={handleReset}
                disabled={assignments.length === 0}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Reset
              </button> */}
            </div>

            {/* Spinner Wheel */}
            <SpinnerWheel
              isSpinning={isSpinning}
              selectedSlot={lastAssignment?.slot ?? null}
              availableSlots={availableSlots}
            />

            {/* Last Assignment */}
            {lastAssignment && (
              <div className="mt-4 rounded-lg border border-[rgba(166,124,0,0.3)] bg-[rgba(240,192,64,0.1)] px-4 py-3 text-center">
                <p className="text-xs text-[#5C4A10]">Assigned:</p>
                <p className="font-heading text-sm font-bold text-[#1A1200]">
                  {lastAssignment.teamName} → Team {lastAssignment.slot}
                </p>
              </div>
            )}

            {/* All 20 slots are assigned */}
            {availableSlots.length === 0 && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center">
                <p className="text-sm font-bold text-green-700">🎉 All 20 teams assigned!</p>
                <p className="text-xs text-green-600">30 league matches scheduled across 5 groups.</p>
              </div>
            )}
          </div>

          {/* ── Right: Match Reveal Card ── */}
          <div className="rounded-2xl border border-[rgba(166,124,0,0.3)] bg-[rgba(255,253,245,0.95)] p-5 shadow-[0_8px_32px_rgba(28,22,0,0.08)]">
            {showReveal && lastAssignment ? (
              <>
                <h2 className="mb-4 text-center font-heading text-sm font-bold uppercase tracking-widest text-[#5C4A10]">
                  Match Reveal Card: {lastAssignment.teamName}
                </h2>
                <div className="space-y-3">
                  {lastMatches.length > 0 ? (
                    lastMatches.map((match, idx) => (
                      <MatchRevealCard key={`${match.team1Slot}-${match.team2Slot}`} match={match} animDelay={idx * 200} />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[rgba(166,124,0,0.25)] py-10 text-center">
                      <p className="text-sm text-[#5C4A10]">First team in Group {lastAssignment.groupNumber}!</p>
                      <p className="text-xs text-[#5C4A10]/70 mt-1">Matches will generate as more teams join this group.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                <span className="text-5xl">🏏</span>
                <h3 className="font-heading text-lg font-bold text-[#1A1200]">Match Reveal</h3>
                <p className="max-w-xs text-sm text-[#5C4A10]">
                  Enter a team name and spin to assign a slot. Matches will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
