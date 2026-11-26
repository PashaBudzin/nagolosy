import { useCallback } from "react"
import type { HistoryResult } from "@/types"
import { HistoryTrainer } from "@/components/history-trainer"
import { HistorySessionResults } from "@/components/history-session-results"
import { SessionPage } from "@/components/session-page"
import { useHistorySessions } from "@/hooks/use-history-sessions"

export function HistoryTest() {
  const { addSession } = useHistorySessions()

  const buildSession = useCallback(
    (results: HistoryResult[], durationMs: number) => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      groupId: -1,
      results,
      durationMs,
    }),
    []
  )

  return (
    <SessionPage
      getIndices={(state) =>
        (state as { historyIndices?: number[] } | null)?.historyIndices ?? []
      }
      Trainer={HistoryTrainer}
      Results={HistorySessionResults}
      buildSession={buildSession}
      addSession={addSession}
    />
  )
}
