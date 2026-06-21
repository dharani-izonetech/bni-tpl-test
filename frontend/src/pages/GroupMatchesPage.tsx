/**
 * Group Matches Page — shows 6 matches for a specific group in a 2-column grid.
 * Route: /group/:id (1-5)
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadMatchScheduleSnapshotAsync, type MatchScheduleSnapshot } from '@/lib/matchScheduleStorage'
import SEO from '@/components/SEO'

const ALL_SLOTS = 'ABCDEFGHIJKLMNOPQRST'.split('')
const GROUPS: Record<number, string[]> = {
  1: ['A', 'B', 'C', 'D'],
  2: ['E', 'F', 'G', 'H'],
  3: ['I', 'J', 'K', 'L'],
  4: ['M', 'N', 'O', 'P'],
  5: ['Q', 'R', 'S', 'T'],
}

function getGroupMatches(groupNum: number, snap: MatchScheduleSnapshot | null) {
  const groupSlots = GROUPS[groupNum] || []
  const matches: { matchNumber: number; team1: string; team2: string }[] = []
  // Global match numbering: group 1 starts at 1, group 2 at 7, etc.
  const baseMatch = (groupNum - 1) * 6
  let idx = 0
  for (let i = 0; i < groupSlots.length; i++) {
    for (let j = i + 1; j < groupSlots.length; j++) {
      const slotIdx1 = ALL_SLOTS.indexOf(groupSlots[i])
      const slotIdx2 = ALL_SLOTS.indexOf(groupSlots[j])
      const team1 = snap?.slotToTeamName?.[slotIdx1]?.trim() || `Team ${groupSlots[i]}`
      const team2 = snap?.slotToTeamName?.[slotIdx2]?.trim() || `Team ${groupSlots[j]}`
      matches.push({ matchNumber: baseMatch + idx + 1, team1, team2 })
      idx++
    }
  }
  return matches
}

export default function GroupMatchesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState<MatchScheduleSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  const groupNum = Math.max(1, Math.min(5, Number(id) || 1))

  useEffect(() => {
    loadMatchScheduleSnapshotAsync()
      .then(snap => { if (snap) setSnapshot(snap) })
      .finally(() => setLoading(false))
  }, [])

  const matches = getGroupMatches(groupNum, snapshot)

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FFFDF5] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(166,124,0,0.3)] border-t-[#A67C00]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFFDF5] px-3 py-6 sm:px-4">
      <SEO title={`Group ${groupNum} Matches`} description={`BNI Cricket Tournament — Group ${groupNum} match fixtures.`} />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(166,124,0,0.3)] bg-white shadow-sm hover:bg-[rgba(240,192,64,0.1)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#A67C00]"><path d="M19 12H5m7-7-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="flex-1 text-center font-heading text-2xl font-bold uppercase tracking-wide text-[#1A1200] sm:text-3xl">
            Group {groupNum} Matches
          </h1>
          <span className="h-10 w-10" />
        </div>

        {/* 2-column match grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {matches.map(match => (
            <div
              key={match.matchNumber}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              {/* Match number badge */}
              <div className="mb-3">
                <span className="rounded bg-[#A67C00] px-2.5 py-1 text-[11px] font-bold text-white">
                  Match {match.matchNumber}
                </span>
              </div>

              {/* Team 1 VS Team 2 */}
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="font-heading text-base font-bold uppercase text-[#1A1200] sm:text-lg">
                  {match.team1}
                </span>
                <span className="text-base font-black text-[#C0392B] sm:text-lg">VS</span>
                <span className="font-heading text-base font-bold uppercase text-[#1A1200] sm:text-lg">
                  {match.team2}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
