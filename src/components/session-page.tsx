import {
  useState,
  useCallback,
  type ComponentProps,
  type ComponentType,
} from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { SessionBase } from "@/types"

interface SessionPageProps<TResult, TExtra extends object> {
  getIndices: (state: unknown) => number[]
  Trainer: ComponentType<
    {
      indices: number[]
      onComplete: (results: TResult[], durationMs: number) => void
      onExit: () => void
    } & TExtra
  >
  trainerProps?: TExtra
  Results: ComponentType<{
    results: TResult[]
    durationMs: number
    onRestart: () => void
    onHome: () => void
  }>
  buildSession: (results: TResult[], durationMs: number) => SessionBase<TResult>
  addSession: (session: SessionBase<TResult>) => void
}

export function SessionPage<TResult, TExtra extends object = object>({
  getIndices,
  Trainer,
  trainerProps,
  Results,
  buildSession,
  addSession,
}: SessionPageProps<TResult, TExtra>) {
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
    [addSession, buildSession]
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

  return (
    <Trainer
      {...({
        indices,
        onComplete: handleComplete,
        onExit: () => {
          navigate("/")
        },
        ...trainerProps,
      } as ComponentProps<typeof Trainer>)}
    />
  )
}
