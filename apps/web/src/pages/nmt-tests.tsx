import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RiArrowLeftLine, RiExternalLinkLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { buildQuickExam, loadNmtExams } from "@/lib/nmt-exams"
import { NMT_SUBJECTS, type NmtExam, type NmtSubjectId } from "@/lib/nmt"

const selectClassName =
  "h-9 rounded-md border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"

export function NmtTests() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState<NmtSubjectId>("ukrainian")
  const [result, setResult] = useState<{
    subject: NmtSubjectId
    exams: NmtExam[] | null
  } | null>(null)

  useEffect(() => {
    let active = true

    loadNmtExams(subject)
      .then((exams) => {
        if (active) setResult({ subject, exams })
      })
      .catch(() => {
        if (active) setResult({ subject, exams: null })
      })

    return () => {
      active = false
    }
  }, [subject])

  const isCurrent = result !== null && result.subject === subject
  const exams =
    result !== null && result.subject === subject ? result.exams : null
  const isLoading = !isCurrent
  const failed = isCurrent && result !== null && result.exams === null

  const byYear = useMemo(() => {
    const groups: { year: number; exams: NmtExam[] }[] = []
    for (const exam of exams ?? []) {
      const last = groups[groups.length - 1]
      if (last?.year === exam.year) last.exams.push(exam)
      else groups.push({ year: exam.year, exams: [exam] })
    }
    return groups
  }, [exams])

  const questionCount =
    exams?.reduce((sum, exam) => sum + exam.questions.length, 0) ?? 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/")}
          aria-label="На головну"
        >
          <RiArrowLeftLine />
        </Button>
        <h1 className="text-2xl font-bold">НМТ пробні тести</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Варіанти ЗНО та НМТ минулих років: основні й додаткові сесії, пробні та
        демонстраційні тести. Завдання з доступних текстів і відповідями — це
        скорочені добірки для тренування, а не повні бланки іспитів.
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          Предмет
        </span>
        <select
          className={selectClassName}
          value={subject}
          onChange={(event) => setSubject(event.target.value as NmtSubjectId)}
        >
          {NMT_SUBJECTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
        <div>
          <h2 className="font-semibold">Швидка сесія</h2>
          <p className="text-sm text-muted-foreground">
            Випадкові завдання з усіх варіантів предмета.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30].map((count) => (
            <Button
              key={count}
              variant="secondary"
              size="sm"
              disabled={!exams || exams.length === 0}
              onClick={() =>
                exams &&
                navigate("/nmt-test/quick", {
                  state: { exam: buildQuickExam(exams, count) },
                })
              }
            >
              {count} завдань
            </Button>
          ))}
        </div>
      </section>

      {exams && (
        <p className="text-sm text-muted-foreground">
          Скорочені варіанти: {exams.length} тестів · {questionCount} завдань
        </p>
      )}

      {failed ? (
        <p className="text-sm text-destructive">
          Не вдалося завантажити тести. Спробуй оновити сторінку.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Завантаження…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Скорочені варіанти</h2>
          {byYear.map((group) => (
            <section key={group.year} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {group.year}
              </h2>
              {group.exams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    className="h-auto min-h-9 flex-1 justify-start py-2 whitespace-normal"
                    onClick={() => navigate(`/nmt-test/${exam.id}`)}
                  >
                    <span className="whitespace-normal">{exam.title}</span>
                    <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                      {exam.questions.length}/{exam.originalQuestionCount}{" "}
                      завдань
                    </span>
                  </Button>
                  {exam.sourceUrl && (
                    <a
                      href={exam.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Офіційне джерело"
                      title="Офіційне джерело"
                    >
                      <RiExternalLinkLine />
                    </a>
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <div className="border-t pt-4 text-center">
        <Button variant="link" size="sm" onClick={() => navigate("/credits")}>
          Подяки та джерела
        </Button>
      </div>
    </div>
  )
}
