import { useEffect, useState } from "react"
import { RiCheckLine, RiCloseLine, RiTimeLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import type {
  AnswerProgress,
  CompetitionCategory,
  CompetitionPhase,
  CompetitionPlayer,
  CompetitionQuestionPayload,
  CompetitionReveal,
} from "@/lib/competition-types"
import { cn } from "@/lib/utils"

const COMBINING_ACUTE = "\u0301"
const VOWELS = new Set("аеєиіїоуюя")

type StressTone = "correct" | "wrong" | "muted"

/** Keep a base letter and its combining acute together as one visual unit. */
function splitGraphemes(text: string): string[] {
  const graphemes: string[] = []
  for (const character of text) {
    if (character === COMBINING_ACUTE && graphemes.length > 0) {
      graphemes[graphemes.length - 1] += character
    } else {
      graphemes.push(character)
    }
  }
  return graphemes
}

interface StressWordProps {
  text: string
  tone?: StressTone
  compact?: boolean
}

function StressWord({ text, tone, compact = false }: StressWordProps) {
  return (
    <span
      aria-label={text}
      className="flex flex-wrap items-center justify-center gap-0.5 leading-none tracking-tight"
    >
      {splitGraphemes(text).map((grapheme, index) => {
        const letter = grapheme.replace(COMBINING_ACUTE, "")
        const isVowel = VOWELS.has(letter.toLowerCase())
        const isStressed = grapheme.includes(COMBINING_ACUTE)

        let className = compact
          ? "inline-flex size-7 items-center justify-center text-lg font-medium transition-all select-none"
          : "inline-flex size-10 items-center justify-center text-2xl font-medium transition-all select-none"

        if (isStressed && (tone === "correct" || tone === "wrong")) {
          className +=
            tone === "correct"
              ? " rounded-md border-2 border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : " rounded-md border-2 border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        } else if (isStressed && !tone) {
          className +=
            " rounded-md border-2 border-amber-500 bg-amber-50 font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        } else if (tone) {
          className += isVowel
            ? " rounded-md border border-border bg-muted/50 text-muted-foreground"
            : " text-muted-foreground"
        } else if (isVowel) {
          className += " rounded-md border border-border"
        } else {
          className += " text-foreground"
        }

        return (
          <span key={index} className={className}>
            {letter === " " ? "\u00A0" : letter}
          </span>
        )
      })}
    </span>
  )
}

interface CompetitionGameProps {
  playerId: string
  category: CompetitionCategory
  phase: CompetitionPhase
  players: CompetitionPlayer[]
  question: CompetitionQuestionPayload
  reveal: CompetitionReveal | null
  selected: number | null
  progress: AnswerProgress | null
  onAnswer: (index: number, optionIndex: number) => void
  onLeave: () => void
}

export function CompetitionGame({
  playerId,
  category,
  phase,
  players,
  question,
  reveal,
  selected,
  progress,
  onAnswer,
  onLeave,
}: CompetitionGameProps) {
  const [remainingMs, setRemainingMs] = useState(question.remainingMs)

  useEffect(() => {
    if (phase !== "playing") return
    const end = Date.now() + question.remainingMs
    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(0, end - Date.now()))
    }, 100)
    return () => window.clearInterval(interval)
  }, [phase, question.remainingMs])

  const remaining = phase === "playing" ? remainingMs : 0
  const secondsLeft = Math.ceil(remaining / 1000)
  const timeUp = phase === "playing" && remaining <= 0
  const percentLeft =
    question.timeLimitMs > 0
      ? Math.min(100, (remaining / question.timeLimitMs) * 100)
      : 0

  const ownAnswer = reveal?.answers.find(
    (answer) => answer.playerId === playerId
  )
  const isStressQuestion = category === "words"
  const board = [...players].sort(
    (a, b) =>
      b.score - a.score ||
      b.correct - a.correct ||
      a.totalTimeMs - b.totalTimeMs
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Питання {question.index + 1} / {question.total}
          </span>
          {phase === "playing" ? (
            <span className="flex items-center gap-1 tabular-nums">
              <RiTimeLine className="size-4" />
              {secondsLeft} с
            </span>
          ) : (
            <span>{reveal ? "Результат" : "Готуємось…"}</span>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-100 ease-linear",
              secondsLeft <= 3 && phase === "playing"
                ? "bg-destructive"
                : "bg-primary"
            )}
            style={{ width: `${percentLeft}%` }}
          />
        </div>
        {progress && (
          <p className="text-right text-xs text-muted-foreground">
            Відповіли {progress.answered} / {progress.total}
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 text-center">
        {question.hint && (
          <p className="mb-1 text-xs text-muted-foreground">{question.hint}</p>
        )}
        <p className="font-serif text-2xl font-medium text-balance">
          {question.prompt}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map((option, index) => {
          const isSelected = selected === index
          const isCorrect = reveal?.correctIndex === index

          let className =
            "flex flex-wrap items-center justify-start gap-x-2 gap-y-1 rounded-md border px-4 py-3 text-left text-base whitespace-normal"

          if (reveal) {
            if (isCorrect) {
              className +=
                " border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            } else if (isSelected) {
              className +=
                " border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            } else {
              className += " border-border bg-muted/50 text-muted-foreground"
            }
          } else if (isSelected) {
            className += " border-primary bg-primary/10 text-foreground"
          } else if (timeUp) {
            className += " border-border bg-muted/50 text-muted-foreground"
          } else {
            className +=
              " bg-transparent hover:border-primary hover:bg-muted cursor-pointer"
          }

          return (
            <button
              key={index}
              type="button"
              className={className}
              disabled={
                phase !== "playing" || selected !== null || timeUp || !!reveal
              }
              onClick={() => onAnswer(question.index, index)}
            >
              <span className="shrink-0 font-semibold">
                {String.fromCharCode(97 + index)})
              </span>
              {isStressQuestion ? (
                <StressWord
                  text={option}
                  tone={
                    reveal
                      ? isCorrect
                        ? "correct"
                        : isSelected
                          ? "wrong"
                          : "muted"
                      : undefined
                  }
                />
              ) : (
                <span>{option}</span>
              )}
            </button>
          )
        })}
      </div>

      {phase === "playing" && selected !== null && (
        <p className="text-center text-sm text-muted-foreground">
          Відповідь прийнято. Чекаємо на інших…
        </p>
      )}

      {phase === "playing" && timeUp && selected === null && (
        <p className="text-center text-sm text-muted-foreground">Час вийшов…</p>
      )}

      {reveal && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              Правильна відповідь:{" "}
              {isStressQuestion ? (
                <StressWord text={reveal.correctText} tone="correct" compact />
              ) : (
                <span className="font-semibold">{reveal.correctText}</span>
              )}
            </p>
            {ownAnswer &&
              (ownAnswer.correct ? (
                <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <RiCheckLine className="size-4" />+{ownAnswer.delta}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                  <RiCloseLine className="size-4" />
                  {ownAnswer.selected === null ? "без відповіді" : "0"}
                </span>
              ))}
          </div>

          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {reveal.answers.map((answer) => (
              <li
                key={answer.playerId}
                className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1"
              >
                <span className="min-w-0 truncate">{answer.name}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    answer.correct
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  )}
                >
                  {answer.correct ? `+${answer.delta}` : "—"}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-center text-xs text-muted-foreground">
            {reveal.index + 1 >= reveal.total
              ? "Підбиваємо підсумки…"
              : "Наступне питання…"}
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Таблиця</h2>
        <ol className="flex flex-col gap-1">
          {board.map((player, index) => (
            <li
              key={player.id}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1 text-sm",
                player.id === playerId && "bg-primary/10"
              )}
            >
              <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {player.name}
                {!player.connected && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (offline)
                  </span>
                )}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {player.score}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="self-center"
        onClick={onLeave}
      >
        Вийти зі змагання
      </Button>
    </div>
  )
}
