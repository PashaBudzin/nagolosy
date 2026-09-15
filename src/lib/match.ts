import { shuffleArray } from "@/lib/stress"

export type MatchMode = "item-to-definition" | "definition-to-item"

export interface MatchItem {
  item: string
  definition: string
}

export function matchPrompt(entry: MatchItem, mode: MatchMode): string {
  return mode === "item-to-definition" ? entry.item : entry.definition
}

export function matchAnswer(entry: MatchItem, mode: MatchMode): string {
  return mode === "item-to-definition" ? entry.definition : entry.item
}

export function buildMatchOptions(
  entries: readonly MatchItem[],
  correct: MatchItem,
  mode: MatchMode,
  count = 4,
  distractorPool: readonly MatchItem[] = entries
): string[] {
  const correctOption = matchAnswer(correct, mode)
  const poolOptions = Array.from(
    new Set(distractorPool.map((entry) => matchAnswer(entry, mode)))
  )
  const distractors = shuffleArray(
    poolOptions.filter((option) => option !== correctOption)
  ).slice(0, count - 1)
  return shuffleArray([correctOption, ...distractors])
}
