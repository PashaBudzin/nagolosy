import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSessions } from "@/hooks/use-sessions"
import { Button } from "@/components/ui/button"
import { displayWord, getWordData } from "@/lib/stress"
import { GROUPS } from "@/data/groups"
import { WORDS_RAW } from "@/data/words"
import type { WordStats } from "@/types"

type SortKey =
  | "ratio-asc"
  | "ratio-desc"
  | "alpha"
  | "total-desc"
  | "correct-desc"
  | "last-attempt-desc"
  | "last-attempt-asc"
  | "sessions-desc"

type StatusFilter = "all" | "struggling" | "medium" | "mastered"
type AttemptedFilter = "all" | "attempted" | "never"
type ExplanationFilter = "all" | "with" | "without"
type DateFilter = "all" | "day" | "week" | "month"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "ratio-asc", label: "за відсотком (від гірших)" },
  { value: "ratio-desc", label: "за відсотком (від кращих)" },
  { value: "alpha", label: "за алфавітом" },
  { value: "total-desc", label: "за кількістю спроб" },
  { value: "correct-desc", label: "за правильними" },
  { value: "last-attempt-desc", label: "за останньою спробою (нові)" },
  { value: "last-attempt-asc", label: "за останньою спробою (старі)" },
  { value: "sessions-desc", label: "за кількістю сесій" },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Усі" },
  { value: "struggling", label: "Проблемні (<50%)" },
  { value: "medium", label: "Середні (50-80%)" },
  { value: "mastered", label: "Засвоєні (>80%)" },
]

const ATTEMPTED_OPTIONS: { value: AttemptedFilter; label: string }[] = [
  { value: "all", label: "Усі" },
  { value: "attempted", label: "Спробовані" },
  { value: "never", label: "Не спробовані" },
]

const EXPLANATION_OPTIONS: { value: ExplanationFilter; label: string }[] = [
  { value: "all", label: "Усі пояснення" },
  { value: "with", label: "З поясненням" },
  { value: "without", label: "Без пояснення" },
]

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "За весь час" },
  { value: "day", label: "За останній день" },
  { value: "week", label: "За останній тиждень" },
  { value: "month", label: "За останній місяць" },
]

const DATE_CUTOFF: Record<DateFilter, number> = {
  all: 0,
  day: Date.now() - 86_400_000,
  week: Date.now() - 604_800_000,
  month: Date.now() - 2_592_000_000,
}

function filterHistoryByDate(stats: WordStats[], cutoff: number): WordStats[] {
  if (cutoff === 0) return stats
  return stats
    .map((w) => {
      const history = w.history.filter((h) => h.timestamp >= cutoff)
      const total = history.length
      const correct = history.filter((h) => h.correct).length
      return { ...w, history, total, correct }
    })
    .filter((w) => w.total > 0)
}

function lastAttemptTimestamp(w: WordStats): number {
  return w.history.length > 0
    ? Math.max(...w.history.map((h) => h.timestamp))
    : -Infinity
}

function sessionCount(w: WordStats): number {
  return new Set(w.history.map((h) => h.sessionId)).size
}

const wordKeyToGroups = new Map<string, number[]>()
WORDS_RAW.forEach((raw, index) => {
  const { text, stressIndices } = getWordData(raw)
  const key = `${text}|${JSON.stringify(stressIndices)}`
  const groups: number[] = []
  for (const group of GROUPS) {
    if (group.wordIndices.includes(index)) {
      groups.push(group.id)
    }
  }
  wordKeyToGroups.set(key, groups)
})

function matchesGroup(w: WordStats, groupId: number): boolean {
  const key = `${w.word}|${JSON.stringify(w.stressIndices)}`
  return wordKeyToGroups.get(key)?.includes(groupId) ?? false
}

export function Stats() {
  const navigate = useNavigate()
  const { getWordStats, clearSessions } = useSessions()
  const stats = getWordStats()

  const [sortKey, setSortKey] = useState<SortKey>("ratio-asc")
  const [groupFilter, setGroupFilter] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [attemptedFilter, setAttemptedFilter] = useState<AttemptedFilter>("all")
  const [explanationFilter, setExplanationFilter] =
    useState<ExplanationFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")

  const totalAttempts = useMemo(
    () => stats.reduce((s, w) => s + w.total, 0),
    [stats],
  )

  const filtered = useMemo(() => {
    let result = [...stats]

    if (dateFilter !== "all") {
      result = filterHistoryByDate(result, DATE_CUTOFF[dateFilter])
    }

    if (groupFilter !== null) {
      result = result.filter((w) => matchesGroup(w, groupFilter))
    }

    if (attemptedFilter === "attempted") {
      result = result.filter((w) => w.total > 0)
    } else if (attemptedFilter === "never") {
      result = result.filter((w) => w.total === 0)
    }

    if (explanationFilter === "with") {
      result = result.filter((w) => w.explanation)
    } else if (explanationFilter === "without") {
      result = result.filter((w) => !w.explanation)
    }

    if (statusFilter === "struggling") {
      result = result.filter((w) => w.total > 0 && w.correct / w.total < 0.5)
    } else if (statusFilter === "medium") {
      result = result.filter((w) => {
        const ratio = w.total > 0 ? w.correct / w.total : 1
        return ratio >= 0.5 && ratio < 0.8
      })
    } else if (statusFilter === "mastered") {
      result = result.filter((w) => {
        const ratio = w.total > 0 ? w.correct / w.total : 1
        return ratio >= 0.8
      })
    }

    result.sort((a, b) => {
      switch (sortKey) {
        case "ratio-asc": {
          const aRatio = a.total > 0 ? a.correct / a.total : 0
          const bRatio = b.total > 0 ? b.correct / b.total : 0
          return aRatio - bRatio
        }
        case "ratio-desc": {
          const aRatio = a.total > 0 ? a.correct / a.total : 0
          const bRatio = b.total > 0 ? b.correct / b.total : 0
          return bRatio - aRatio
        }
        case "alpha":
          return a.word.localeCompare(b.word)
        case "total-desc":
          return b.total - a.total
        case "correct-desc":
          return b.correct - a.correct
        case "last-attempt-desc":
          return lastAttemptTimestamp(b) - lastAttemptTimestamp(a)
        case "last-attempt-asc":
          return lastAttemptTimestamp(a) - lastAttemptTimestamp(b)
        case "sessions-desc":
          return sessionCount(b) - sessionCount(a)
        default:
          return 0
      }
    })

    return result
  }, [
    stats,
    sortKey,
    groupFilter,
    statusFilter,
    attemptedFilter,
    explanationFilter,
    dateFilter,
  ])

  const totals = useMemo(
    () => ({
      attempts: filtered.reduce((s, w) => s + w.total, 0),
      correct: filtered.reduce((s, w) => s + w.correct, 0),
    }),
    [filtered],
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Статистика</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            На головну
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Очистити всю історію сесій?")) clearSessions()
            }}
          >
            Очистити
          </Button>
        </div>
      </div>

      {totalAttempts === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ще не було сесій. Почни тренування!
        </p>
      ) : (
        <>
          <div className="text-center text-sm text-muted-foreground">
            Усього спроб: {totals.attempts} · Правильно: {totals.correct} (
            {totals.attempts > 0
              ? Math.round((totals.correct / totals.attempts) * 100)
              : 0}
            %)
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={groupFilter ?? ""}
              onChange={(e) =>
                setGroupFilter(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">Усі групи</option>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              {DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={attemptedFilter}
              onChange={(e) =>
                setAttemptedFilter(e.target.value as AttemptedFilter)
              }
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              {ATTEMPTED_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={explanationFilter}
              onChange={(e) =>
                setExplanationFilter(e.target.value as ExplanationFilter)
              }
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              {EXPLANATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Немає слів, що відповідають фільтрам
            </p>
          ) : (
            <div className="max-h-[60vh] divide-y overflow-y-auto rounded-lg border">
              {filtered.map((w) => {
                const ratio = w.total > 0 ? w.correct / w.total : 1
                const recent = w.history.slice(0, 5)
                return (
                  <div
                    key={w.word}
                    className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 text-sm"
                  >
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {displayWord(w.word, w.stressIndices)}
                      {w.explanation && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {w.explanation}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={
                          ratio < 0.5
                            ? "text-red-500"
                            : ratio < 0.8
                              ? "text-amber-500"
                              : "text-green-500"
                        }
                      >
                        {w.correct}/{w.total}
                      </span>
                      <div className="ml-2 flex gap-0.5">
                        {recent.map((h, i) => (
                          <span
                            key={i}
                            className={
                              h.correct ? "text-green-500" : "text-red-500"
                            }
                          >
                            {h.correct ? "●" : "○"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
