import { useCallback } from "react"
import type { TermSessionData, TermStats } from "@/types"
import { TERMS_RAW } from "@/data/terms"
import { parseTerm } from "@/lib/terms"
import { createSessionStore, useSessionStore } from "@/lib/session-store"
import { aggregateStats, pickProblematic } from "@/lib/session-stats"

const termStore = createSessionStore<TermSessionData>(
  "nagolosy-term-sessions",
  5
)

const termIndexByTerm = new Map<string, number>()
TERMS_RAW.forEach((raw, index) => {
  termIndexByTerm.set(parseTerm(raw).item, index)
})

export function useTermSessions() {
  const { sessions, addSession, clearSessions } = useSessionStore(termStore)

  const getTermStats = useCallback((): TermStats[] => {
    const seeds = TERMS_RAW.map(
      (raw): Omit<TermStats, "total" | "correct" | "history"> => {
        const { item, definition } = parseTerm(raw)
        return { term: item, definition }
      }
    )
    return aggregateStats(
      seeds,
      (item) => item.term,
      termStore.getSnapshot(),
      (result) => result.term
    )
  }, [])

  const getProblematicTermIndices = useCallback(
    (count: number): number[] => {
      const sorted = pickProblematic(getTermStats(), count)
      return sorted
        .map((stat) => termIndexByTerm.get(stat.term))
        .filter((i): i is number => i !== undefined)
    },
    [getTermStats]
  )

  return {
    sessions,
    addSession,
    clearSessions,
    getTermStats,
    getProblematicTermIndices,
  }
}
