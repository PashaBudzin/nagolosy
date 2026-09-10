import { useCallback } from "react"
import type { HistorySessionData, HistoryStats } from "@/types"
import { HISTORY_FACTS } from "@/data/history"
import { createSessionStore, useSessionStore } from "@/lib/session-store"
import { aggregateStats, pickProblematic } from "@/lib/session-stats"

const historyStore = createSessionStore<HistorySessionData>(
  "nagolosy-history-sessions",
  5
)

const historyIndexByEvent = new Map<string, number>()
HISTORY_FACTS.forEach((fact, index) => {
  historyIndexByEvent.set(fact.event, index)
})

export function useHistorySessions() {
  const { sessions, addSession, clearSessions } = useSessionStore(historyStore)

  const getHistoryStats = useCallback((): HistoryStats[] => {
    const seeds = HISTORY_FACTS.map(
      (fact): Omit<HistoryStats, "total" | "correct" | "history"> => ({
        date: fact.date,
        event: fact.event,
      })
    )
    return aggregateStats(
      seeds,
      (item) => item.event,
      historyStore.getSnapshot(),
      (result) => result.event
    )
  }, [])

  const getProblematicHistoryIndices = useCallback(
    (count: number): number[] => {
      const sorted = pickProblematic(getHistoryStats(), count)
      return sorted
        .map((stat) => historyIndexByEvent.get(stat.event))
        .filter((i): i is number => i !== undefined)
    },
    [getHistoryStats]
  )

  return {
    sessions,
    addSession,
    clearSessions,
    getHistoryStats,
    getProblematicHistoryIndices,
  }
}
