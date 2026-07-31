import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/format"

interface SessionResultsShellProps<TResult extends { correct: boolean }> {
  results: TResult[]
  durationMs: number
  onRestart: () => void
  onHome: () => void
  renderRow: (result: TResult) => ReactNode
}

export function SessionResultsShell<TResult extends { correct: boolean }>({
  results,
  durationMs,
  onRestart,
  onHome,
  renderRow,
}: SessionResultsShellProps<TResult>) {
  const correct = results.filter((r) => r.correct).length
  const wrong = results.length - correct
  const total = results.length
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Результат сесії</h2>
        <p className="mt-2 text-4xl font-bold">{percent}%</p>
        <div className="mt-1 flex justify-center gap-4 text-sm text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">✓ {correct}</span>
          <span className="text-red-600 dark:text-red-400">✗ {wrong}</span>
          <span>з {total}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Час: {formatTime(durationMs)}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onHome}>
          На головну
        </Button>
        <Button className="flex-1" onClick={onRestart}>
          Ще раз
        </Button>
      </div>

      <div className="max-h-96 divide-y overflow-y-auto rounded-lg border">
        {results.map((r, i) => (
          <div key={i}>{renderRow(r)}</div>
        ))}
      </div>
    </div>
  )
}
