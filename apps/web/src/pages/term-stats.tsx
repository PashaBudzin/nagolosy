import { useMemo } from "react"
import { useTermSessions } from "@/hooks/use-term-sessions"
import { TERM_GROUPS } from "@/data/term-groups"
import { TERMS_RAW } from "@/data/terms"
import { parseTerm } from "@/lib/terms"
import { StatsPage } from "@/components/stats-page"

const termKeyToGroups = new Map<string, number[]>()
TERMS_RAW.forEach((raw, index) => {
  const { item } = parseTerm(raw)
  const groups: number[] = []
  for (const group of TERM_GROUPS) {
    if (group.termIndices.includes(index)) {
      groups.push(group.id)
    }
  }
  termKeyToGroups.set(item, groups)
})

export function TermStats() {
  const { getTermStats, clearSessions } = useTermSessions()
  const stats = useMemo(() => getTermStats(), [getTermStats])

  return (
    <StatsPage
      title="Статистика · історичні терміни"
      stats={stats}
      clearSessions={clearSessions}
      groups={TERM_GROUPS}
      matchesGroup={(w, groupId) =>
        termKeyToGroups.get(w.term)?.includes(groupId) ?? false
      }
      alphaKey={(w) => w.term}
      rowKey={(w) => w.term}
      emptyMessage="Немає термінів, що відповідають фільтрам"
      renderRow={(w, ratio) => (
        <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 text-sm">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-serif font-medium">{w.term}</span>
            <span className="text-xs text-muted-foreground">
              {w.definition}
            </span>
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
