import { useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { StressTrainer } from "@/components/stress-trainer"
import { SessionResults } from "@/components/session-results"
import type { WordResult, SessionData } from "@/types"
import { useSessions } from "@/hooks/use-sessions"

export function Test() {
  const location = useLocation()
  const navigate = useNavigate()
  const { addSession } = useSessions()
  const [results, setResults] = useState<WordResult[] | null>(null)
  const [durationMs, setDurationMs] = useState(0)

  const wordIndices = (location.state as { wordIndices: number[] })
    ?.wordIndices ?? []

  const handleComplete = useCallback(
    (r: WordResult[], d: number) => {
      setResults(r)
      setDurationMs(d)
      const session: SessionData = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        groupId: -1,
        results: r,
        durationMs: d,
      }
      addSession(session)
    },
    [addSession],
  )

  if (wordIndices.length === 0) {
    navigate("/", { replace: true })
    return null
  }

  if (results) {
    return (
      <div className="p-6">
        <SessionResults
          results={results}
          durationMs={durationMs}
          onRestart={() => {
            setResults(null)
            setDurationMs(0)
          }}
          onHome={() => navigate("/")}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <StressTrainer
        wordIndices={wordIndices}
        onComplete={handleComplete}
      />
    </div>
  )
}
