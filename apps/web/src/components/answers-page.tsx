import { useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export interface AnswerGroup {
  id: string
  name: string
  indices: number[]
}

const ANSWER_TABS = [
  { key: "words", label: "Наголоси", path: "/answers/words" },
  { key: "idioms", label: "Фразеологізми", path: "/answers/idioms" },
  { key: "history", label: "Історія дати", path: "/answers/history" },
  { key: "terms", label: "Терміни", path: "/answers/terms" },
  {
    key: "visual-history",
    label: "Візуальні",
    path: "/answers/visual-history",
  },
] as const

export type AnswerTab = (typeof ANSWER_TABS)[number]["key"]

interface AnswersPageProps<TItem> {
  title: string
  activeTab: AnswerTab
  groupNoun: string
  groups: AnswerGroup[]
  items: readonly TItem[]
  rowKey: (item: TItem) => string
  emptyMessage: string
  renderRow: (item: TItem) => ReactNode
}

export function AnswersPage<TItem>({
  title,
  activeTab,
  groupNoun,
  groups,
  items,
  rowKey,
  emptyMessage,
  renderRow,
}: AnswersPageProps<TItem>) {
  const navigate = useNavigate()
  const [groupFilter, setGroupFilter] = useState<string>("")

  const visible = useMemo<TItem[]>(() => {
    if (groupFilter === "") return [...items]
    const group = groups.find((g) => g.id === groupFilter)
    if (!group) return [...items]
    const result: TItem[] = []
    for (const idx of group.indices) {
      const item = items[idx]
      if (item !== undefined) result.push(item)
    }
    return result
  }, [groupFilter, groups, items])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          На головну
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ANSWER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={tab.key === activeTab ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Усі групи</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.indices.length})
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Показано: {visible.length} {groupNoun}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="max-h-[70vh] divide-y overflow-y-auto rounded-lg border">
          {visible.map((item) => (
            <div key={rowKey(item)}>{renderRow(item)}</div>
          ))}
        </div>
      )}
    </div>
  )
}
