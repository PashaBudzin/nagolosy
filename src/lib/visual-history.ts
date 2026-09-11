import { VISUAL_HISTORY_ITEMS } from "@/data/visual-history"
import { shuffleArray } from "@/lib/stress"

function getItemsInSameCategory(correctName: string, category: string) {
  return VISUAL_HISTORY_ITEMS.filter(
    (item) => item.category === category && item.name !== correctName
  )
}

export function buildVisualHistoryQuizOptions(
  correctName: string,
  category: string,
  count = 4
): string[] {
  const sameCategory = getItemsInSameCategory(correctName, category)
  const distractors = shuffleArray(sameCategory.map((i) => i.name)).slice(
    0,
    count - 1
  )
  return shuffleArray([correctName, ...distractors])
}
