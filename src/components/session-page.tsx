import { useState, useCallback, type ComponentType } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { SessionBase } from "@/types"

interface SessionPageProps<TResult> {
  getIndices: (state: unknown) => number[]
  Trainer: ComponentType<{
    indices: number[]
    onComplete: (results: TResult[], durationMs: number) => void
  }>
  Results: ComponentType<{
    results: TResult[]
    durationMs: number
    onRestart: () => void
    onHome: () => void
  }>
  buildSession: (results: TResult[], durationMs: number) => SessionBase<TResult>
  addSession: (session: SessionBase<TResult>) => void
}

export function SessionPage<TResult>({
  getIndices,
  Trainer,
  Results,
  buildSession,
  addSession,
}: SessionPageProps<TResult>) {
  const location = useLocation()
  const navigate = useNavigate()
  const [results, setResults] = useState<TResult[] | null>(null)
  const [durationMs, setDurationMs] = useState(0)

  const indices = getIndices(location.state)

  const handleComplete = useCallback(
    (r: TResult[], d: number) => {
      setResults(r)
      setDurationMs(d)
      addSession(buildSession(r, d))
    },
    [addSession, buildSession],
  )

  if (indices.length === 0) {
    navigate("/", { replace: true })
    return null
  }

  if (results) {
    return (
      <div className="p-6">
        <Results
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

  return <Trainer indices={indices} onComplete={handleComplete} />
}
