import { useMemo } from "react"
import { useIdiomSessions } from "@/hooks/use-idiom-sessions"
import { IDIOM_GROUPS } from "@/data/idiom-groups"
import { IDIOMS_RAW } from "@/data/idioms"
import { parseIdiom } from "@/lib/idioms"
import { StatsPage } from "@/components/stats-page"

const idiomKeyToGroups = new Map<string, number[]>()
IDIOMS_RAW.forEach((raw, index) => {
  const { idiom } = parseIdiom(raw)
  const groups: number[] = []
  for (const group of IDIOM_GROUPS) {
    if (group.idiomIndices.includes(index)) {
      groups.push(group.id)
    }
  }
  idiomKeyToGroups.set(idiom, groups)
})

export function IdiomStats() {
  const { getIdiomStats, clearSessions } = useIdiomSessions()
  const stats = useMemo(() => getIdiomStats(), [getIdiomStats])

  return (
    <StatsPage
      title="Статистика · фразеологізми"
      stats={stats}
      clearSessions={clearSessions}
      groups={IDIOM_GROUPS}
      matchesGroup={(w, groupId) =>
        idiomKeyToGroups.get(w.idiom)?.includes(groupId) ?? false
      }
      alphaKey={(w) => w.idiom}
      rowKey={(w) => w.idiom}
      emptyMessage="Немає фразеологізмів, що відповідають фільтрам"
      renderRow={(w, ratio) => (
        <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 text-sm">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-serif font-medium">{w.idiom}</span>
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
