import type { IdiomResult } from "@/types"
import { SessionResultsShell } from "@/components/session-results-shell"

interface IdiomSessionResultsProps {
  results: IdiomResult[]
  durationMs: number
  onRestart: () => void
  onHome: () => void
}

export function IdiomSessionResults({
  results,
  durationMs,
  onRestart,
  onHome,
}: IdiomSessionResultsProps) {
  return (
    <SessionResultsShell
      results={results}
      durationMs={durationMs}
      onRestart={onRestart}
      onHome={onHome}
      renderRow={(r) => (
        <div className="flex gap-3 px-4 py-2 text-sm">
          <span
            className={
              r.correct
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {r.correct ? "✓" : "✗"}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-serif font-medium">{r.idiom}</span>
            <span
              className={
                r.correct
                  ? "text-muted-foreground"
                  : "text-red-600 line-through dark:text-red-400"
              }
            >
              {r.selected}
            </span>
            {!r.correct && (
              <span className="text-green-600 dark:text-green-400">
                {r.definition}
              </span>
            )}
          </div>
        </div>
      )}
    />
  )
}
