import { useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

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

interface ItemStatsLike {
  total: number
  correct: number
  history: { timestamp: number; correct: boolean; sessionId: string }[]
}

interface StatsPageProps<TItem extends ItemStatsLike> {
  title: string
  stats: TItem[]
  clearSessions: () => void
  groups: { id: number; name: string }[]
  matchesGroup: (item: TItem, groupId: number) => boolean
  alphaKey: (item: TItem) => string
  rowKey: (item: TItem) => string
  explanation?: (item: TItem) => string | undefined
  emptyMessage: string
  renderRow: (item: TItem, ratio: number) => ReactNode
}

function filterHistoryByDate<TItem extends ItemStatsLike>(
  stats: TItem[],
  cutoff: number,
): TItem[] {
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

function lastAttemptTimestamp(w: ItemStatsLike): number {
  return w.history.length > 0
    ? Math.max(...w.history.map((h) => h.timestamp))
    : -Infinity
}

function sessionCount(w: ItemStatsLike): number {
  return new Set(w.history.map((h) => h.sessionId)).size
}

export function StatsPage<TItem extends ItemStatsLike>({
  title,
  stats,
  clearSessions,
  groups,
  matchesGroup,
  alphaKey,
  rowKey,
  explanation,
  emptyMessage,
  renderRow,
}: StatsPageProps<TItem>) {
  const navigate = useNavigate()

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

    if (explanation && explanationFilter === "with") {
      result = result.filter((w) => explanation(w))
    } else if (explanation && explanationFilter === "without") {
      result = result.filter((w) => !explanation(w))
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
          return alphaKey(a).localeCompare(alphaKey(b))
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
    matchesGroup,
    alphaKey,
    explanation,
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
        <h1 className="text-xl font-bold">{title}</h1>
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
              {groups.map((g) => (
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

            {explanation && (
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
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <div className="max-h-[60vh] divide-y overflow-y-auto rounded-lg border">
              {filtered.map((w) => {
                const ratio = w.total > 0 ? w.correct / w.total : 1
                return (
                  <div key={rowKey(w)}>{renderRow(w, ratio)}</div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
