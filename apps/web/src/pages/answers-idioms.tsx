import { IDIOM_ENTRIES } from "@/lib/idioms"
import { IDIOM_GROUPS } from "@/data/idiom-groups"
import { AnswersPage, type AnswerGroup } from "@/components/answers-page"

const groups: AnswerGroup[] = IDIOM_GROUPS.map((g) => ({
  id: `${g.id}`,
  name: g.name,
  indices: g.idiomIndices,
}))

export function AnswersIdioms() {
  return (
    <AnswersPage
      title="Відповіді · фразеологізми"
      activeTab="idioms"
      groupNoun="фраз"
      groups={groups}
      items={IDIOM_ENTRIES}
      rowKey={(e) => e.idiom}
      emptyMessage="Немає фразеологізмів у цій групі"
      renderRow={(e) => (
        <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-2 px-4 py-2 text-sm">
          <span className="font-medium">{e.idiom}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-green-600 dark:text-green-400">
            {e.definition}
          </span>
        </div>
      )}
    />
  )
}
