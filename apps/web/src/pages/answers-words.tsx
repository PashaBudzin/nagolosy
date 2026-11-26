import { WORDS_RAW } from "@/data/words"
import { GROUPS } from "@/data/groups"
import { getWordData } from "@/lib/stress"
import { AnswersPage, type AnswerGroup } from "@/components/answers-page"

const words = WORDS_RAW.map(getWordData)

const groups: AnswerGroup[] = GROUPS.map((g) => ({
  id: `${g.id}`,
  name: g.name,
  indices: g.wordIndices,
}))

export function AnswersWords() {
  return (
    <AnswersPage
      title="Відповіді · наголоси"
      activeTab="words"
      groupNoun="слів"
      groups={groups}
      items={words}
      rowKey={(w) => `${w.text}|${w.stressIndices.join(",")}`}
      emptyMessage="Немає слів у цій групі"
      renderRow={(w) => (
        <div className="px-4 py-2">
          <span className="flex flex-wrap items-center gap-2 text-lg tracking-tight">
            {w.text.split("").map((ch, i) => {
              const stressed = w.stressIndices.includes(i)
              return (
                <span
                  key={i}
                  className={
                    stressed
                      ? "font-semibold text-green-600 dark:text-green-400"
                      : undefined
                  }
                >
                  {ch}
                  {stressed ? "\u0301" : ""}
                </span>
              )
            })}
            {w.explanation && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {w.explanation}
              </span>
            )}
          </span>
        </div>
      )}
    />
  )
}
