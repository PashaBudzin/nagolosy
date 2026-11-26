import type { VisualHistoryResult } from "@/types"
import { SessionResultsShell } from "@/components/session-results-shell"
import { cn } from "@/lib/utils"

interface VisualHistorySessionResultsProps {
  results: VisualHistoryResult[]
  durationMs: number
  onRestart: () => void
  onHome: () => void
}

export function VisualHistorySessionResults({
  results,
  durationMs,
  onRestart,
  onHome,
}: VisualHistorySessionResultsProps) {
  return (
    <SessionResultsShell
      results={results}
      durationMs={durationMs}
      onRestart={onRestart}
      onHome={onHome}
      renderRow={(result: VisualHistoryResult) => (
        <div className="flex items-center gap-3 p-3">
          <img
            src={result.imageUrl}
            alt={result.name}
            className="h-16 w-16 shrink-0 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                result.correct
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {result.name}
            </p>
            {result.selected && !result.correct && (
              <p className="text-xs text-muted-foreground">
                Ваша відповідь: {result.selected}
              </p>
            )}
          </div>
          <span className="text-lg">{result.correct ? "✓" : "✗"}</span>
        </div>
      )}
    />
  )
}
