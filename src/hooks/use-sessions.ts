import { useCallback } from "react"
import type { SessionData, WordStats } from "@/types"
import { WORDS_RAW } from "@/data/words"
import { getWordData } from "@/lib/stress"
import { createSessionStore, useSessionStore } from "@/lib/session-store"
import { aggregateStats, pickProblematic } from "@/lib/session-stats"

const wordStore = createSessionStore<SessionData>("nagolosy-sessions", 5)

const wordIndexByKey = new Map<string, number>()
WORDS_RAW.forEach((raw, index) => {
  const { text, stressIndices } = getWordData(raw)
  wordIndexByKey.set(`${text}|${JSON.stringify(stressIndices)}`, index)
})

export function useSessions() {
  const { sessions, addSession, clearSessions } = useSessionStore(wordStore)

  const getWordStats = useCallback((): WordStats[] => {
    const seeds = WORDS_RAW.map(
      (raw): Omit<WordStats, "total" | "correct" | "history"> => {
        const { text, stressIndices, explanation } = getWordData(raw)
        return { word: text, stressIndices, explanation }
      },
    )
    return aggregateStats(
      seeds,
      (item) => `${item.word}|${JSON.stringify(item.stressIndices)}`,
      wordStore.getSnapshot(),
      (result) => `${result.word}|${JSON.stringify(result.stressIndices)}`,
    )
  }, [])

  const getProblematicWordIndices = useCallback(
    (count: number): number[] => {
      const sorted = pickProblematic(getWordStats(), count)
      return sorted
        .map(
          (stat) =>
            wordIndexByKey.get(
              `${stat.word}|${JSON.stringify(stat.stressIndices)}`,
            ),
        )
        .filter((i): i is number => i !== undefined)
    },
    [getWordStats],
  )

  return {
    sessions,
    addSession,
    clearSessions,
    getWordStats,
    getProblematicWordIndices,
  }
}
