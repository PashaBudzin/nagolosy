import { useMemo } from "react"
import { useSessions } from "@/hooks/use-sessions"
import { displayWord, getWordData } from "@/lib/stress"
import { GROUPS } from "@/data/groups"
import { WORDS_RAW } from "@/data/words"
import { StatsPage } from "@/components/stats-page"

const wordKeyToGroups = new Map<string, number[]>()
WORDS_RAW.forEach((raw, index) => {
  const { text, stressIndices } = getWordData(raw)
  const key = `${text}|${JSON.stringify(stressIndices)}`
  const groups: number[] = []
  for (const group of GROUPS) {
    if (group.wordIndices.includes(index)) {
      groups.push(group.id)
    }
  }
  wordKeyToGroups.set(key, groups)
})

export function Stats() {
  const { getWordStats, clearSessions } = useSessions()
  const stats = useMemo(() => getWordStats(), [getWordStats])

  return (
    <StatsPage
      title="Статистика"
      stats={stats}
      clearSessions={clearSessions}
      groups={GROUPS}
      matchesGroup={(w, groupId) => {
        const key = `${w.word}|${JSON.stringify(w.stressIndices)}`
        return wordKeyToGroups.get(key)?.includes(groupId) ?? false
      }}
      alphaKey={(w) => w.word}
      rowKey={(w) => w.word}
      explanation={(w) => w.explanation}
      emptyMessage="Немає слів, що відповідають фільтрам"
      renderRow={(w, ratio) => (
        <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 text-sm">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            {displayWord(w.word, w.stressIndices)}
            {w.explanation && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {w.explanation}
              </span>
            )}
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
