import type { WordResult } from "@/types"
import { Button } from "@/components/ui/button"
import { displayWord } from "@/lib/stress"

interface SessionResultsProps {
  results: WordResult[]
  durationMs: number
  onRestart: () => void
  onHome: () => void
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function SessionResults({ results, durationMs, onRestart, onHome }: SessionResultsProps) {
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
          <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span
              className={
                r.correct
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {r.correct ? "✓" : "✗"}
            </span>
            <span className="font-medium">{displayWord(r.word, r.stressIndices)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
