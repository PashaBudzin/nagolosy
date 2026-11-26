import { useCallback } from "react"
import type { IdiomResult } from "@/types"
import { IdiomTrainer } from "@/components/idiom-trainer"
import { IdiomSessionResults } from "@/components/idiom-session-results"
import { SessionPage } from "@/components/session-page"
import { useIdiomSessions } from "@/hooks/use-idiom-sessions"

export function IdiomTest() {
  const { addSession } = useIdiomSessions()

  const buildSession = useCallback(
    (results: IdiomResult[], durationMs: number) => ({
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
        (state as { idiomIndices?: number[] } | null)?.idiomIndices ?? []
      }
      Trainer={IdiomTrainer}
      Results={IdiomSessionResults}
      buildSession={buildSession}
      addSession={addSession}
    />
  )
}
