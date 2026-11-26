import { useCallback } from "react"
import type { VisualHistorySessionData, VisualHistoryStats } from "@/types"
import { VISUAL_HISTORY_ITEMS } from "@/data/visual-history"
import { createSessionStore, useSessionStore } from "@/lib/session-store"
import { aggregateStats, pickProblematic } from "@/lib/session-stats"

const visualHistoryStore = createSessionStore<VisualHistorySessionData>(
  "nagolosy-visual-history-sessions",
  5,
)

const itemNameIndex = new Map<string, number>()
VISUAL_HISTORY_ITEMS.forEach((item, index) => {
  itemNameIndex.set(item.name, index)
})

export function useVisualHistorySessions() {
  const { sessions, addSession, clearSessions } =
    useSessionStore(visualHistoryStore)

  const getVisualHistoryStats = useCallback((): VisualHistoryStats[] => {
    const seeds = VISUAL_HISTORY_ITEMS.map(
      (item): Omit<VisualHistoryStats, "total" | "correct" | "history"> => ({
        imageUrl: item.imageUrl,
        name: item.name,
        category: item.category,
      }),
    )
    return aggregateStats(
      seeds,
      (item) => item.name,
      visualHistoryStore.getSnapshot(),
      (result) => result.name,
    )
  }, [])

  const getProblematicVisualHistoryIndices = useCallback(
    (count: number): number[] => {
      const sorted = pickProblematic(getVisualHistoryStats(), count)
      return sorted
        .map((stat) => itemNameIndex.get(stat.name))
        .filter((i): i is number => i !== undefined)
    },
    [getVisualHistoryStats],
  )

  return {
    sessions,
    addSession,
    clearSessions,
    getVisualHistoryStats,
    getProblematicVisualHistoryIndices,
  }
}
