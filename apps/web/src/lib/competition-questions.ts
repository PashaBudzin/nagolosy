import { GROUPS } from "@/data/groups"
import { IDIOM_GROUPS } from "@/data/idiom-groups"
import { HISTORY_GROUPS } from "@/data/history-groups"
import { TERM_GROUPS } from "@/data/term-groups"
import { WORDS_RAW } from "@/data/words"
import { IDIOM_ENTRIES, buildQuizOptions } from "@/lib/idioms"
import { HISTORY_ENTRIES, buildHistoryQuizOptions } from "@/lib/history"
import { TERM_ENTRIES } from "@/lib/terms"
import { buildMatchOptions, type MatchItem } from "@/lib/match"
import { displayWord, getWordData, shuffleArray } from "@/lib/stress"
import type {
  CompetitionCategory,
  CompetitionConfig,
  CompetitionQuestion,
} from "@/lib/competition-types"

const VOWELS = new Set("аеєиіїоуюя")

export const COMPETITION_CATEGORIES: {
  id: CompetitionCategory
  label: string
  description: string
}[] = [
  { id: "words", label: "Наголоси", description: "Де наголос у слові?" },
  {
    id: "idioms",
    label: "Фразеологізми",
    description: "Що означає фразеологізм?",
  },
  {
    id: "history",
    label: "Історія дати",
    description: "Коли відбулася подія?",
  },
  { id: "terms", label: "Терміни", description: "Що означає термін?" },
]

export const COMPETITION_CATEGORY_LABELS: Record<CompetitionCategory, string> =
  {
    words: "Наголоси",
    idioms: "Фразеологізми",
    history: "Історія дати",
    terms: "Терміни",
  }

export const COMPETITION_GROUPS: Record<
  CompetitionCategory,
  { id: number; name: string }[]
> = {
  words: GROUPS.map((group) => ({ id: group.id, name: group.name })),
  idioms: IDIOM_GROUPS.map((group) => ({ id: group.id, name: group.name })),
  history: HISTORY_GROUPS.map((group) => ({ id: group.id, name: group.name })),
  terms: TERM_GROUPS.map((group) => ({ id: group.id, name: group.name })),
}

function allIndices(length: number): number[] {
  return Array.from({ length }, (_, index) => index)
}

function poolFor(
  category: CompetitionCategory,
  groupId: number | "all"
): number[] {
  switch (category) {
    case "words": {
      if (groupId === "all") return allIndices(WORDS_RAW.length)
      return GROUPS.find((group) => group.id === groupId)?.wordIndices ?? []
    }
    case "idioms": {
      if (groupId === "all") return allIndices(IDIOM_ENTRIES.length)
      return (
        IDIOM_GROUPS.find((group) => group.id === groupId)?.idiomIndices ?? []
      )
    }
    case "history": {
      if (groupId === "all") return allIndices(HISTORY_ENTRIES.length)
      return (
        HISTORY_GROUPS.find((group) => group.id === groupId)?.historyIndices ??
        []
      )
    }
    case "terms": {
      if (groupId === "all") return allIndices(TERM_ENTRIES.length)
      return (
        TERM_GROUPS.find((group) => group.id === groupId)?.termIndices ?? []
      )
    }
  }
}

function wordQuestions(pool: number[], count: number): CompetitionQuestion[] {
  const questions: CompetitionQuestion[] = []

  for (const index of shuffleArray(pool)) {
    if (questions.length >= count) break

    const raw = WORDS_RAW[index]
    if (!raw) continue

    const { text, stressIndices, explanation } = getWordData(raw)
    if (stressIndices.length !== 1) continue

    const vowelPositions = [...text]
      .map((character, position) => (VOWELS.has(character) ? position : -1))
      .filter((position) => position !== -1)

    if (vowelPositions.length < 2) continue

    const correctIndex = vowelPositions.indexOf(stressIndices[0])
    if (correctIndex === -1) continue

    // Each option renders the same word with the stress mark moved to one
    // vowel, so the player picks the stressed position.
    const options = vowelPositions.map((position) =>
      displayWord(text, [position])
    )

    questions.push({
      prompt: text,
      ...(explanation ? { hint: explanation } : {}),
      options,
      correctIndex,
    })
  }

  return questions
}

function idiomQuestions(pool: number[], count: number): CompetitionQuestion[] {
  const questions: CompetitionQuestion[] = []

  for (const index of shuffleArray(pool)) {
    if (questions.length >= count) break

    const entry = IDIOM_ENTRIES[index]
    if (!entry?.definition) continue

    const options = buildQuizOptions(entry.definition)
    const correctIndex = options.indexOf(entry.definition)
    if (correctIndex === -1) continue

    questions.push({ prompt: entry.idiom, options, correctIndex })
  }

  return questions
}

function historyQuestions(
  pool: number[],
  count: number
): CompetitionQuestion[] {
  const questions: CompetitionQuestion[] = []

  for (const index of shuffleArray(pool)) {
    if (questions.length >= count) break

    const entry = HISTORY_ENTRIES[index]
    if (!entry?.event) continue

    const options = buildHistoryQuizOptions(entry.date)
    const correctIndex = options.indexOf(entry.date)
    if (correctIndex === -1) continue

    questions.push({ prompt: entry.event, options, correctIndex })
  }

  return questions
}

function termQuestions(pool: number[], count: number): CompetitionQuestion[] {
  const questions: CompetitionQuestion[] = []
  const entries = pool
    .map((index) => TERM_ENTRIES[index])
    .filter((entry): entry is MatchItem => Boolean(entry?.definition))

  for (const entry of shuffleArray(entries)) {
    if (questions.length >= count) break

    const options = buildMatchOptions(TERM_ENTRIES, entry, "item-to-definition")
    const correctIndex = options.indexOf(entry.definition)
    if (correctIndex === -1) continue

    questions.push({ prompt: entry.item, options, correctIndex })
  }

  return questions
}

export function buildCompetitionQuestions(
  config: CompetitionConfig
): CompetitionQuestion[] {
  const requested = Math.min(Math.max(Math.round(config.questionCount), 1), 30)
  const pool = poolFor(config.category, config.groupId)

  switch (config.category) {
    case "words":
      return wordQuestions(pool, requested)
    case "idioms":
      return idiomQuestions(pool, requested)
    case "history":
      return historyQuestions(pool, requested)
    case "terms":
      return termQuestions(pool, requested)
  }
}
