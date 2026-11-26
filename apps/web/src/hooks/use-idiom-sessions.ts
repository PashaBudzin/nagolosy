import { useCallback } from "react"
import type { IdiomSessionData, IdiomStats } from "@/types"
import { IDIOMS_RAW } from "@/data/idioms"
import { parseIdiom } from "@/lib/idioms"
import { createSessionStore, useSessionStore } from "@/lib/session-store"
import { aggregateStats, pickProblematic } from "@/lib/session-stats"

const idiomStore = createSessionStore<IdiomSessionData>(
  "nagolosy-idiom-sessions",
  5,
)

const idiomIndexByIdiom = new Map<string, number>()
IDIOMS_RAW.forEach((raw, index) => {
  idiomIndexByIdiom.set(parseIdiom(raw).idiom, index)
})

export function useIdiomSessions() {
  const { sessions, addSession, clearSessions } = useSessionStore(idiomStore)

  const getIdiomStats = useCallback((): IdiomStats[] => {
    const seeds = IDIOMS_RAW.map(
      (raw): Omit<IdiomStats, "total" | "correct" | "history"> => {
        const { idiom, definition } = parseIdiom(raw)
        return { idiom, definition }
      },
    )
    return aggregateStats(
      seeds,
      (item) => item.idiom,
      idiomStore.getSnapshot(),
      (result) => result.idiom,
    )
  }, [])

  const getProblematicIdiomIndices = useCallback(
    (count: number): number[] => {
      const sorted = pickProblematic(getIdiomStats(), count)
      return sorted
        .map((stat) => idiomIndexByIdiom.get(stat.idiom))
        .filter((i): i is number => i !== undefined)
    },
    [getIdiomStats],
  )

  return {
    sessions,
    addSession,
    clearSessions,
    getIdiomStats,
    getProblematicIdiomIndices,
  }
}
