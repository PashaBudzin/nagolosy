import { useState, useCallback, useMemo, useEffect } from "react"
import type { TermResult } from "@/types"
import { TERM_ENTRIES } from "@/lib/terms"
import { TERM_GROUPS } from "@/data/term-groups"
import {
  buildMatchOptions,
  matchAnswer,
  matchPrompt,
  type MatchItem,
  type MatchMode,
} from "@/lib/match"
import { shuffleArray } from "@/lib/stress"
import { useTimer } from "@/hooks/use-timer"
import { TrainerShell, type Feedback } from "@/components/trainer-shell"
import { Kbd } from "@/components/ui/kbd"

interface TermTrainerProps {
  indices: number[]
  mode: MatchMode
  onComplete: (results: TermResult[], durationMs: number) => void
  onExit: () => void
}

const groupEntriesByTerm: Map<string, readonly MatchItem[]> = (() => {
  const map = new Map<string, readonly MatchItem[]>()
  for (const group of TERM_GROUPS) {
    const groupEntries = group.termIndices.map((i) => TERM_ENTRIES[i])
    for (const entry of groupEntries) {
      map.set(entry.item, groupEntries)
    }
  }
  return map
})()

export function TermTrainer({
  indices,
  mode,
  onComplete,
  onExit,
}: TermTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<TermResult[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>("idle")
  const { elapsedMs, now } = useTimer()

  const correctCount = results.filter((r) => r.correct).length
  const wrongCount = results.length - correctCount

  const shuffled = useMemo(() => shuffleArray(indices), [indices])

  const entry = TERM_ENTRIES[shuffled[currentIndex]]

  const options = useMemo(() => {
    const sameGroup = groupEntriesByTerm.get(entry.item) ?? TERM_ENTRIES
    const pool = sameGroup.length >= 4 ? sameGroup : TERM_ENTRIES
    return buildMatchOptions(pool, entry, mode)
  }, [entry, mode])

  const handleSelect = useCallback(
    (option: string) => {
      if (feedback !== "idle") return

      const correctOption = matchAnswer(entry, mode)
      setSelected(option)
      const isCorrect = option === correctOption
      setFeedback(isCorrect ? "correct" : "wrong")

      setResults((prev) => [
        ...prev,
        {
          term: entry.item,
          definition: entry.definition,
          options,
          selected: option,
          correct: isCorrect,
        },
      ])
    },
    [feedback, entry, options, mode]
  )

  const handleNext = useCallback(() => {
    const next = currentIndex + 1
    if (next >= shuffled.length) {
      onComplete(results, now())
      return
    }
    setCurrentIndex(next)
    setSelected(null)
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
        if (idx < options.length) handleSelect(options[idx])
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [feedback, handleNext, handleSelect, options])

  const hints = (
    <>
      <span className="flex items-center gap-1">
        <Kbd>1</Kbd>–<Kbd>4</Kbd> вибрати відповідь
      </span>
      <span className="flex items-center gap-1">
        <Kbd>Enter</Kbd> далі
      </span>
    </>
  )

  const prompt = matchPrompt(entry, mode)
  const correctOption = matchAnswer(entry, mode)
  const isPromptItem = mode === "item-to-definition"

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
      hints={hints}
    >
      <p className="text-sm text-muted-foreground">
        {isPromptItem ? "Що означає термін?" : "Доберіть термін за визначенням"}
      </p>

      <div className="w-full rounded-lg border bg-card p-4 text-center">
        <span
          className={
            isPromptItem
              ? "font-serif text-xl font-medium"
              : "text-sm text-muted-foreground"
          }
        >
          {prompt}
        </span>
      </div>

      <div className="flex w-full flex-col gap-2">
        {options.map((option, i) => {
          const isSelected = selected === option
          const isCorrectOption = option === correctOption

          let className =
            "justify-start rounded-md border px-4 py-3 text-left text-sm whitespace-normal"

          if (feedback === "idle") {
            className +=
              " bg-transparent hover:border-primary hover:bg-muted cursor-pointer"
          } else if (isCorrectOption) {
            className +=
              " border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          } else if (isSelected) {
            className +=
              " border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          } else {
            className += " border-border bg-muted/50 text-muted-foreground"
          }

          return (
            <button
              key={i}
              className={className}
              onClick={() => handleSelect(option)}
              disabled={feedback !== "idle"}
            >
              <span className="mr-2 font-semibold">
                {String.fromCharCode(97 + i)})
              </span>
              {option}
            </button>
          )
        })}
      </div>
    </TrainerShell>
  )
}
