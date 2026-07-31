import { useState, useCallback, useMemo } from "react"
import type { WordResult } from "@/types"
import { WORDS_RAW } from "@/data/words"
import { getWordData, shuffleArray } from "@/lib/stress"
import { useTimer } from "@/hooks/use-timer"
import { TrainerShell, type Feedback } from "@/components/trainer-shell"

interface StressTrainerProps {
  indices: number[]
  onComplete: (results: WordResult[], durationMs: number) => void
}

type LetterState = "idle" | "correct" | "wrong" | "revealed"

const VOWELS = new Set([
  "а", "е", "є", "и", "і", "ї", "о", "у", "ю", "я",
  "А", "Е", "Є", "И", "І", "Ї", "О", "У", "Ю", "Я",
])

function isVowel(ch: string) {
  return VOWELS.has(ch)
}

export function StressTrainer({ indices, onComplete }: StressTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<WordResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback>("idle")
  const { elapsedMs, now } = useTimer()

  const correctCount = results.filter((r) => r.correct).length
  const wrongCount = results.length - correctCount

  const shuffled = useMemo(() => shuffleArray(indices), [indices])

  const currentRaw = WORDS_RAW[shuffled[currentIndex]]
  const { text, stressIndices, explanation } = useMemo(
    () => getWordData(currentRaw),
    [currentRaw],
  )

  const letterStates = useMemo((): LetterState[] => {
    const states: LetterState[] = Array(text.length).fill("idle")
    if (feedback === "idle" || selectedIndex === null) return states

    if (feedback === "wrong") {
      if (selectedIndex !== null) states[selectedIndex] = "wrong"
      for (const si of stressIndices) {
        if (si !== selectedIndex) states[si] = "revealed"
      }
    }

    if (feedback === "correct") {
      for (const si of stressIndices) {
        states[si] = "correct"
      }
    }

    return states
  }, [feedback, selectedIndex, stressIndices, text.length])

  const handleLetterClick = useCallback(
    (index: number) => {
      if (feedback !== "idle") return

      setSelectedIndex(index)
      const isCorrect = stressIndices.includes(index)
      setFeedback(isCorrect ? "correct" : "wrong")

      setResults((prev) => [
        ...prev,
        { word: text, stressIndices, correct: isCorrect, explanation },
      ])
    },
    [feedback, stressIndices, text, explanation],
  )

  const handleNext = useCallback(() => {
    const next = currentIndex + 1
    if (next >= shuffled.length) {
      onComplete(results, now())
      return
    }
    setCurrentIndex(next)
    setSelectedIndex(null)
    setFeedback("idle")
  }, [currentIndex, shuffled.length, onComplete, results, now])

  return (
    <TrainerShell
      elapsedMs={elapsedMs}
      currentIndex={currentIndex}
      total={shuffled.length}
      correctCount={correctCount}
      wrongCount={wrongCount}
      feedback={feedback}
      onNext={handleNext}
    >
      {explanation && (
        <div className="rounded-md bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground">
          {explanation}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-0.5 leading-none tracking-tight">
        {text.split("").map((ch, i) => {
          const state = letterStates[i]
          const isVowelLetter = isVowel(ch)

          let className =
            "inline-flex items-center justify-center text-2xl font-medium transition-all select-none"

          if (state === "correct") {
            className +=
              " size-10 rounded-md border-2 border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          } else if (state === "wrong") {
            className +=
              " size-10 rounded-md border-2 border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          } else if (state === "revealed") {
            className +=
              " size-10 rounded-md border-2 border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          } else if (isVowelLetter) {
            className +=
              " size-10 cursor-pointer rounded-md border border-border hover:border-primary hover:bg-muted"
          } else {
            className += " text-foreground"
          }

          return (
            <button
              key={i}
              className={className}
              onClick={() => isVowelLetter && handleLetterClick(i)}
              disabled={!isVowelLetter || feedback !== "idle"}
              tabIndex={isVowelLetter ? 0 : -1}
            >
              {ch === " " ? "\u00A0" : ch}
            </button>
          )
        })}
      </div>
    </TrainerShell>
  )
}
