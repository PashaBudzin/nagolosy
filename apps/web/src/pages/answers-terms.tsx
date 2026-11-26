import { TERM_ENTRIES } from "@/lib/terms"
import { TERM_GROUPS } from "@/data/term-groups"
import { AnswersPage, type AnswerGroup } from "@/components/answers-page"

const groups: AnswerGroup[] = TERM_GROUPS.map((g) => ({
  id: `${g.id}`,
  name: g.name,
  indices: g.termIndices,
}))

export function AnswersTerms() {
  return (
    <AnswersPage
      title="Відповіді · терміни"
      activeTab="terms"
      groupNoun="термінів"
      groups={groups}
      items={TERM_ENTRIES}
      rowKey={(e) => e.item}
      emptyMessage="Немає термінів у цій групі"
      renderRow={(e) => (
        <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-2 px-4 py-2 text-sm">
          <span className="font-medium">{e.item}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-green-600 dark:text-green-400">
            {e.definition}
          </span>
        </div>
      )}
    />
  )
}
