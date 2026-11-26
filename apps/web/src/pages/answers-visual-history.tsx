import { VISUAL_HISTORY_ITEMS } from "@/data/visual-history"
import { VISUAL_HISTORY_GROUPS } from "@/data/visual-history-groups"
import { AnswersPage, type AnswerGroup } from "@/components/answers-page"

const groups: AnswerGroup[] = VISUAL_HISTORY_GROUPS.map((g, i) => ({
  id: `${i}`,
  name: g.name,
  indices: g.itemIndices,
}))

export function AnswersVisualHistory() {
  return (
    <AnswersPage
      title="Відповіді · візуальні об'єкти"
      activeTab="visual-history"
      groupNoun="об'єктів"
      groups={groups}
      items={VISUAL_HISTORY_ITEMS}
      rowKey={(e) => e.id}
      emptyMessage="Немає об'єктів у цій категорії"
      renderRow={(e) => (
        <div className="flex items-center gap-3 px-4 py-2 text-sm">
          <img
            src={e.imageUrl}
            alt={e.name}
            className="h-12 w-12 shrink-0 rounded object-cover"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-medium text-green-600 dark:text-green-400">
              {e.name}
            </span>
            <span className="text-xs text-muted-foreground">{e.category}</span>
          </span>
        </div>
      )}
    />
  )
}
