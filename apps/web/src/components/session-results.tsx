import type { WordResult } from "@/types"
import { displayWord } from "@/lib/stress"
import { SessionResultsShell } from "@/components/session-results-shell"

interface SessionResultsProps {
  results: WordResult[]
  durationMs: number
  onRestart: () => void
  onHome: () => void
}

export function SessionResults({
  results,
  durationMs,
  onRestart,
  onHome,
}: SessionResultsProps) {
  return (
    <SessionResultsShell
      results={results}
      durationMs={durationMs}
      onRestart={onRestart}
      onHome={onHome}
      renderRow={(r) => (
        <div className="flex items-center gap-3 px-4 py-2 text-sm">
          <span
            className={
              r.correct
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {r.correct ? "✓" : "✗"}
          </span>
          <span className="flex items-center gap-2 font-medium">
            {displayWord(r.word, r.stressIndices)}
            {r.explanation && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {r.explanation}
              </span>
            )}
          </span>
        </div>
      )}
    />
  )
}
