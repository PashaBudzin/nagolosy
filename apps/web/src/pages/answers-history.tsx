import { HISTORY_ENTRIES } from "@/lib/history"
import { HISTORY_GROUPS } from "@/data/history-groups"
import { AnswersPage, type AnswerGroup } from "@/components/answers-page"

const groups: AnswerGroup[] = HISTORY_GROUPS.flatMap((g) => [
  { id: `h${g.id}`, name: g.name, indices: g.historyIndices },
  ...g.subgroups.map((s) => ({
    id: `h${g.id}-${s.id}`,
    name: s.name,
    indices: s.historyIndices,
  })),
])

export function AnswersHistory() {
  return (
    <AnswersPage
      title="Відповіді · історія"
      activeTab="history"
      groupNoun="подій"
      groups={groups}
      items={HISTORY_ENTRIES}
      rowKey={(e) => `${e.event}|${e.date}`}
      emptyMessage="Немає подій у цьому періоді"
      renderRow={(e) => (
        <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-2 text-sm">
          <span className="min-w-0 font-serif font-medium">{e.event}</span>
          <span className="text-right font-semibold text-green-600 dark:text-green-400">
            {e.date}
          </span>
        </div>
      )}
    />
  )
}
