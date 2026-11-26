import { useCallback } from "react"
import { useLocation } from "react-router-dom"
import type { MatchMode } from "@/lib/match"
import type { TermResult } from "@/types"
import { TermTrainer } from "@/components/term-trainer"
import { TermSessionResults } from "@/components/term-session-results"
import { SessionPage } from "@/components/session-page"
import { useTermSessions } from "@/hooks/use-term-sessions"

interface TermTestState {
  termIndices?: number[]
  termMode?: MatchMode
}

export function TermTest() {
  const location = useLocation()
  const { addSession } = useTermSessions()

  const mode =
    (location.state as TermTestState | null)?.termMode ?? "item-to-definition"

  const buildSession = useCallback(
    (results: TermResult[], durationMs: number) => ({
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
      getIndices={(state) => (state as TermTestState | null)?.termIndices ?? []}
      Trainer={TermTrainer}
      trainerProps={{ mode }}
      Results={TermSessionResults}
      buildSession={buildSession}
      addSession={addSession}
    />
  )
}
