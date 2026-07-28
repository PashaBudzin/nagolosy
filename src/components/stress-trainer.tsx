import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { WordResult } from "@/types"
import { WORDS_RAW } from "@/data/words"
import { getWordData, shuffleArray } from "@/lib/stress"
import { Button } from "@/components/ui/button"

interface StressTrainerProps {
  wordIndices: number[]
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

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function StressTrainer({ wordIndices, onComplete }: StressTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<WordResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle")
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const correctCount = results.filter((r) => r.correct).length
  const wrongCount = results.length - correctCount

  const shuffled = useMemo(() => shuffleArray(wordIndices), [wordIndices])

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
      const duration = Date.now() - startTimeRef.current
      onComplete(results, duration)
      return
    }
    setCurrentIndex(next)
    setSelectedIndex(null)
    setFeedback("idle")
  }, [currentIndex, shuffled.length, onComplete, results])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-sm items-center justify-between text-sm text-muted-foreground">
        <span>{currentIndex + 1} / {shuffled.length}</span>
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

      {explanation && (
        <p className="text-center text-sm text-muted-foreground">
          {explanation}
        </p>
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

      {feedback !== "idle" && (
        <div className="flex flex-col items-center gap-3">
          <p
            className={
              feedback === "correct"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {feedback === "correct"
              ? "Правильно!"
              : "Помилка!"}
          </p>
          <Button onClick={handleNext}>
            {currentIndex + 1 >= shuffled.length ? "Результат" : "Далі"}
          </Button>
        </div>
      )}
    </div>
  )
}
