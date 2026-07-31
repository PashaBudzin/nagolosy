import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export type Feedback = "idle" | "correct" | "wrong"

interface TrainerShellProps {
  elapsedMs: number
  currentIndex: number
  total: number
  correctCount: number
  wrongCount: number
  feedback: Feedback
  onNext: () => void
  hints?: ReactNode
  children: ReactNode
}

export function TrainerShell({
  elapsedMs,
  currentIndex,
  total,
  correctCount,
  wrongCount,
  feedback,
  onNext,
  hints,
  children,
}: TrainerShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-6 py-6 lg:min-h-screen lg:items-stretch lg:gap-0 lg:px-0 lg:py-0">
      <div className="flex w-full items-center justify-between text-sm text-muted-foreground lg:px-6 lg:py-4">
        <span>
          {currentIndex + 1} / {total}
        </span>
        <span className="tabular-nums">{formatTime(elapsedMs)}</span>
      </div>

      <div className="flex w-full flex-col items-center gap-6 lg:flex-1 lg:justify-center">
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 dark:text-green-400">
            ✓ {correctCount}
          </span>
          <span className="text-red-600 dark:text-red-400">✗ {wrongCount}</span>
        </div>

        {children}

        {feedback !== "idle" && (
          <div className="flex flex-col items-center gap-3">
            <p
              className={cn(
                feedback === "correct"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {feedback === "correct" ? "Правильно!" : "Помилка!"}
            </p>
            <Button onClick={onNext}>
              {currentIndex + 1 >= total ? "Результат" : "Далі"}
            </Button>
          </div>
        )}
      </div>

      {hints && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 py-4 text-xs text-muted-foreground">
          {hints}
        </div>
      )}
    </div>
  )
}
