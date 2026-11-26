import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { RiArrowLeftLine, RiFlagLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { FormattedText } from "@/components/ui/formatted-text"
import { useTimer } from "@/hooks/use-timer"
import { formatTime } from "@/lib/format"
import { findNmtExam } from "@/lib/nmt-exams"
import { isNmtAnswerCorrect, type NmtExam } from "@/lib/nmt"
import { cn } from "@/lib/utils"

type Answers = Record<string, string[]>

interface RunnerProps {
  exam: NmtExam
  onExit: () => void
  onRestart: () => void
}

function NmtExamRunner({ exam, onExit, onRestart }: RunnerProps) {
  const { elapsedMs, now } = useTimer()
  const [answers, setAnswers] = useState<Answers>({})
  const [current, setCurrent] = useState(0)
  const [flagged, setFlagged] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  const [durationMs, setDurationMs] = useState(0)

  const questions = exam.questions
  const question = questions[current]
  const answeredCount = questions.filter(
    (q) => (answers[q.id]?.length ?? 0) > 0
  ).length

  const results = useMemo(
    () =>
      questions.map((q) => {
        const selected = answers[q.id] ?? []
        return {
          question: q,
          selected,
          correct: isNmtAnswerCorrect(q, selected),
        }
      }),
    [questions, answers]
  )
  const correctCount = results.filter((result) => result.correct).length
  const percent =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0

  const toggleAnswer = (key: string) => {
    setAnswers((previous) => {
      const selected = previous[question.id] ?? []
      if (question.type === "single") {
        return { ...previous, [question.id]: [key] }
      }
      return {
        ...previous,
        [question.id]: selected.includes(key)
          ? selected.filter((item) => item !== key)
          : [...selected, key],
      }
    })
  }

  const toggleFlag = () => {
    setFlagged((previous) =>
      previous.includes(question.id)
        ? previous.filter((id) => id !== question.id)
        : [...previous, question.id]
    )
  }

  const finish = () => {
    if (
      answeredCount < questions.length &&
      !window.confirm("Не всі завдання мають відповідь. Завершити тест?")
    ) {
      return
    }
    setDurationMs(now())
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onExit}
            aria-label="До списку тестів"
          >
            <RiArrowLeftLine />
          </Button>
          <h1 className="text-2xl font-bold">Результат</h1>
        </div>

        <p className="text-sm text-muted-foreground">{exam.title}</p>

        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-4xl font-bold">{percent}%</p>
          <div className="mt-2 flex justify-center gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400">
              ✓ {correctCount}
            </span>
            <span className="text-red-600 dark:text-red-400">
              ✗ {questions.length - correctCount}
            </span>
            <span className="text-muted-foreground">з {questions.length}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Час: {formatTime(durationMs)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onExit}>
            До тестів
          </Button>
          <Button className="flex-1" onClick={onRestart}>
            Пройти ще раз
          </Button>
        </div>

        <h2 className="text-lg font-semibold">Розбір завдань</h2>
        <div className="max-h-[70vh] divide-y overflow-y-auto rounded-lg border">
          {results.map((result, index) => (
            <details key={result.question.id} className="p-3">
              <summary className="cursor-pointer text-sm">
                <span
                  className={cn(
                    "font-semibold",
                    result.correct
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {index + 1}. {result.correct ? "✓" : "✗"}
                </span>{" "}
                <span className="text-muted-foreground">
                  {result.question.question.slice(0, 70)}
                  {result.question.question.length > 70 ? "…" : ""}
                </span>
              </summary>
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-sm whitespace-pre-line">
                  <FormattedText text={result.question.question} />
                </p>
                {result.question.imageUrl && (
                  <img
                    src={result.question.imageUrl}
                    alt="Завдання"
                    className="max-h-80 w-full rounded-lg border object-contain"
                  />
                )}
                {result.question.options.map((option) => {
                  const isCorrect = result.question.correct.includes(option.key)
                  const isSelected = result.selected.includes(option.key)
                  return (
                    <div
                      key={option.key}
                      className={cn(
                        "flex items-start gap-2 rounded-md border p-2 text-sm",
                        isCorrect &&
                          "border-green-500 bg-green-50 dark:bg-green-950",
                        isSelected &&
                          !isCorrect &&
                          "border-red-500 bg-red-50 dark:bg-red-950"
                      )}
                    >
                      <span className="font-medium">{option.key})</span>
                      <span>
                        <FormattedText text={option.text} />
                      </span>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    )
  }

  const selected = answers[question.id] ?? []

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <RiArrowLeftLine />
          Вийти
        </Button>
        <span className="truncate text-sm font-medium">{exam.title}</span>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {formatTime(elapsedMs)}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Завдання {current + 1} з {questions.length}
        </span>
        <span>
          {question.type === "multi" ? "Кілька відповідей" : "Одна відповідь"}
        </span>
      </div>

      <p className="font-serif text-lg text-balance whitespace-pre-line">
        <FormattedText text={question.question} />
      </p>

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="Завдання"
          className="max-h-80 w-full rounded-lg border object-contain"
        />
      )}

      <div className="flex flex-col gap-2">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.key)
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => toggleAnswer(option.key)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-medium",
                  isSelected &&
                    "border-primary bg-primary text-primary-foreground"
                )}
              >
                {option.key}
              </span>
              <span className="whitespace-pre-line">
                <FormattedText text={option.text} />
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setCurrent((index) => index - 1)}
        >
          Назад
        </Button>
        <Button
          variant={flagged.includes(question.id) ? "default" : "outline"}
          onClick={toggleFlag}
        >
          <RiFlagLine />
          Позначити
        </Button>
        <Button
          className="ml-auto"
          disabled={current === questions.length - 1}
          onClick={() => setCurrent((index) => index + 1)}
        >
          Далі
        </Button>
      </div>

      <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
        {questions.map((item, index) => {
          const isAnswered = (answers[item.id]?.length ?? 0) > 0
          const isFlagged = flagged.includes(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Завдання ${index + 1}`}
              className={cn(
                "flex size-8 items-center justify-center rounded-md border text-xs tabular-nums",
                index === current
                  ? "border-primary bg-primary text-primary-foreground"
                  : isAnswered
                    ? "border-border bg-secondary text-secondary-foreground"
                    : "border-border",
                isFlagged && "ring-1 ring-amber-500"
              )}
            >
              {index + 1}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Відповідено {answeredCount} з {questions.length}
        {flagged.length > 0 ? ` · Позначено ${flagged.length}` : ""}
      </p>

      <Button onClick={finish}>Завершити тест</Button>
    </div>
  )
}

export function NmtTest() {
  const { examId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const stateExam = (location.state as { exam?: NmtExam } | null)?.exam
  const hasStateExam = Boolean(stateExam)
  const [loaded, setLoaded] = useState<{
    id: string
    exam: NmtExam | null
  } | null>(null)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    let active = true

    if (examId && !hasStateExam) {
      findNmtExam(examId)
        .then((found) => {
          if (active) setLoaded({ id: examId, exam: found })
        })
        .catch(() => {
          if (active) setLoaded({ id: examId, exam: null })
        })
    }

    return () => {
      active = false
    }
  }, [examId, hasStateExam])

  const isLoading = !hasStateExam && Boolean(examId) && loaded?.id !== examId
  const exam = stateExam ?? (isLoading ? null : (loaded?.exam ?? null))

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Завантаження…</p>
  }

  if (!exam) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 p-6">
        <p className="text-lg font-semibold">Тест не знайдено</p>
        <Button onClick={() => navigate("/nmt-tests")}>До списку тестів</Button>
      </div>
    )
  }

  return (
    <NmtExamRunner
      key={`${exam.id}-${runId}`}
      exam={exam}
      onExit={() => navigate("/nmt-tests")}
      onRestart={() => setRunId((id) => id + 1)}
    />
  )
}
