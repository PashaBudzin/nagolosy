import { useState, useCallback, useMemo, useEffect } from "react"
import type { VisualHistoryResult } from "@/types"
import { VISUAL_HISTORY_ITEMS } from "@/data/visual-history"
import { buildVisualHistoryQuizOptions } from "@/lib/visual-history"
import { shuffleArray } from "@/lib/stress"
import { useTimer } from "@/hooks/use-timer"
import { TrainerShell, type Feedback } from "@/components/trainer-shell"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

interface VisualHistoryTrainerProps {
  indices: number[]
  onComplete: (results: VisualHistoryResult[], durationMs: number) => void
  onExit: () => void
}

export function VisualHistoryTrainer({
  indices,
  onComplete,
  onExit,
}: VisualHistoryTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<VisualHistoryResult[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>("idle")
  const { elapsedMs, now } = useTimer()

  const correctCount = results.filter((r) => r.correct).length
  const wrongCount = results.length - correctCount

  const shuffled = useMemo(() => shuffleArray(indices), [indices])

  const currentItem = VISUAL_HISTORY_ITEMS[shuffled[currentIndex]]

  const options = useMemo(() => {
    if (!currentItem) return []
    return buildVisualHistoryQuizOptions(currentItem.name, currentItem.category)
  }, [currentItem])

  const handleOptionClick = useCallback(
    (option: string) => {
      if (feedback !== "idle") return

      setSelectedOption(option)
      const isCorrect = option === currentItem.name
      setFeedback(isCorrect ? "correct" : "wrong")

      setResults((prev) => [
        ...prev,
        {
          imageUrl: currentItem.imageUrl,
          name: currentItem.name,
          category: currentItem.category,
          options,
          selected: option,
          correct: isCorrect,
        },
      ])
    },
    [feedback, currentItem, options]
  )

  const handleNext = useCallback(() => {
    const next = currentIndex + 1
    if (next >= shuffled.length) {
      onComplete(results, now())
      return
    }
    setCurrentIndex(next)
    setSelectedOption(null)
    setFeedback("idle")
  }, [currentIndex, shuffled.length, onComplete, results, now])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (feedback !== "idle") {
        if (e.key === "Enter") handleNext()
        return
      }
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1
        if (idx < options.length) handleOptionClick(options[idx])
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [feedback, handleNext, handleOptionClick, options])

  return (
    <TrainerShell
      elapsedMs={elapsedMs}
      currentIndex={currentIndex}
      total={shuffled.length}
      correctCount={correctCount}
      wrongCount={wrongCount}
      feedback={feedback}
      onNext={handleNext}
      onExit={onExit}
      hints={
        <>
          <span className="flex items-center gap-1">
            <Kbd>1</Kbd>–<Kbd>4</Kbd> вибрати відповідь
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd> далі
          </span>
        </>
      }
    >
      <div className="flex w-full flex-col items-center gap-4">
        <div className="text-xs text-muted-foreground">
          {currentItem?.category}
        </div>

        <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg border bg-muted">
          <img
            src={currentItem?.imageUrl}
            alt={currentItem?.name}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-2">
          {options.map((option, i) => {
            const isSelected = option === selectedOption
            const isCorrectOption = option === currentItem?.name
            const showResult = feedback !== "idle"

            let className = "w-full text-left text-sm"
            if (showResult && isCorrectOption) {
              className +=
                " border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            } else if (showResult && isSelected && !isCorrectOption) {
              className +=
                " border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }

            return (
              <Button
                key={option}
                variant="outline"
                className={cn(
                  className,
                  "h-auto py-3 break-words whitespace-normal"
                )}
                onClick={() => handleOptionClick(option)}
                disabled={feedback !== "idle"}
              >
                <span className="mr-2 text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                {option}
              </Button>
            )
          })}
        </div>
      </div>
    </TrainerShell>
  )
}
