import { useMemo } from "react"
import { useVisualHistorySessions } from "@/hooks/use-visual-history-sessions"
import { VISUAL_HISTORY_GROUPS } from "@/data/visual-history-groups"
import { VISUAL_HISTORY_ITEMS } from "@/data/visual-history"
import { StatsPage } from "@/components/stats-page"

const itemNameToGroups = new Map<string, number[]>()
VISUAL_HISTORY_GROUPS.forEach((group, i) => {
  for (const idx of group.itemIndices) {
    const name = VISUAL_HISTORY_ITEMS[idx]?.name
    if (!name) continue
    const groups = itemNameToGroups.get(name)
    if (groups) {
      groups.push(i)
    } else {
      itemNameToGroups.set(name, [i])
    }
  }
})

export function VisualHistoryStats() {
  const { getVisualHistoryStats, clearSessions } = useVisualHistorySessions()
  const stats = useMemo(() => getVisualHistoryStats(), [getVisualHistoryStats])

  return (
    <StatsPage
      title="Статистика · візуальні об'єкти"
      stats={stats}
      clearSessions={clearSessions}
      groups={VISUAL_HISTORY_GROUPS.map((g, i) => ({
        id: i,
        name: g.name,
      }))}
      matchesGroup={(item, groupId) =>
        itemNameToGroups.get(item.name)?.includes(groupId) ?? false
      }
      alphaKey={(item) => item.name}
      rowKey={(item) => item.name}
      emptyMessage="Немає візуальних об'єктів, що відповідають фільтрам"
      renderRow={(item, ratio) => (
        <div className="flex items-center gap-3 px-4 py-2 text-sm">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-12 w-12 shrink-0 rounded object-cover"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-medium">{item.name}</span>
            <span className="text-xs text-muted-foreground">
              {item.category}
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
              {item.correct}/{item.total}
            </span>
            <div className="ml-2 flex gap-0.5">
              {item.history.slice(0, 5).map((h, i) => (
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
