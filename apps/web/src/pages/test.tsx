import { useCallback } from "react"
import type { WordResult } from "@/types"
import { StressTrainer } from "@/components/stress-trainer"
import { SessionResults } from "@/components/session-results"
import { SessionPage } from "@/components/session-page"
import { useSessions } from "@/hooks/use-sessions"

export function Test() {
  const { addSession } = useSessions()

  const buildSession = useCallback(
    (results: WordResult[], durationMs: number) => ({
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
        (state as { wordIndices?: number[] } | null)?.wordIndices ?? []
      }
      Trainer={StressTrainer}
      Results={SessionResults}
      buildSession={buildSession}
      addSession={addSession}
    />
  )
}
