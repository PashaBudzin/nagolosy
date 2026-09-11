import { useCallback } from "react"
import type { VisualHistoryResult } from "@/types"
import { VisualHistoryTrainer } from "@/components/visual-history-trainer"
import { VisualHistorySessionResults } from "@/components/visual-history-session-results"
import { SessionPage } from "@/components/session-page"
import { useVisualHistorySessions } from "@/hooks/use-visual-history-sessions"

export function VisualHistoryTest() {
  const { addSession } = useVisualHistorySessions()

  const buildSession = useCallback(
    (results: VisualHistoryResult[], durationMs: number) => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      groupId: -1,
      results,
      durationMs,
    }),
    [],
  )

  return (
    <SessionPage
      getIndices={(state) =>
        (state as { visualHistoryIndices?: number[] } | null)
          ?.visualHistoryIndices ?? []
      }
      Trainer={VisualHistoryTrainer}
      Results={VisualHistorySessionResults}
      buildSession={buildSession}
      addSession={addSession}
    />
  )
}
