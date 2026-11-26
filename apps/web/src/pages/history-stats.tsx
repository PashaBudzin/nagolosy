import { useMemo } from "react"
import { useHistorySessions } from "@/hooks/use-history-sessions"
import { HISTORY_GROUPS } from "@/data/history-groups"
import { HISTORY_FACTS } from "@/data/history"
import { StatsPage } from "@/components/stats-page"

const historyKeyToGroups = new Map<string, number[]>()
HISTORY_FACTS.forEach((fact, index) => {
  const groups: number[] = []
  for (const group of HISTORY_GROUPS) {
    if (group.historyIndices.includes(index)) {
      groups.push(group.id)
    }
  }
  historyKeyToGroups.set(fact.event, groups)
})

export function HistoryStats() {
  const { getHistoryStats, clearSessions } = useHistorySessions()
  const stats = useMemo(() => getHistoryStats(), [getHistoryStats])

  return (
    <StatsPage
      title="Статистика · історія"
      stats={stats}
      clearSessions={clearSessions}
      groups={HISTORY_GROUPS}
      matchesGroup={(w, groupId) =>
        historyKeyToGroups.get(w.event)?.includes(groupId) ?? false
      }
      alphaKey={(w) => w.event}
      rowKey={(w) => w.event}
      emptyMessage="Немає подій, що відповідають фільтрам"
      renderRow={(w, ratio) => (
        <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 text-sm">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-serif font-medium">{w.event}</span>
            <span className="text-xs text-muted-foreground">{w.date}</span>
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
              {w.history.slice(0, 5).map((h, i) => (
                <span
                  key={i}
                  className={h.correct ? "text-green-500" : "text-red-500"}
                >
                  {h.correct ? "●" : "○"}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  )
}
