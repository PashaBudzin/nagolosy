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
  children,
}: TrainerShellProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
        <span>{currentIndex + 1} / {total}</span>
        <span className="tabular-nums">{formatTime(elapsedMs)}</span>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-green-600 dark:text-green-400">
          ✓ {correctCount}
        </span>
        <span className="text-red-600 dark:text-red-400">
          ✗ {wrongCount}
        </span>
      </div>

      {children}

      {feedback !== "idle" && (
        <div className="flex flex-col items-center gap-3">
          <p
            className={cn(
              feedback === "correct"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
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
  )
}
