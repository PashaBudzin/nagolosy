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
import { NMT_SUBJECTS, type NmtSubjectId } from "@/lib/nmt"
import { loadNmtExams } from "@/lib/nmt-exams"
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
  {
    id: "nmt",
    label: "НМТ тести",
    description: "Завдання з пробних тестів ЗНО та НМТ",
  },
]

export const COMPETITION_CATEGORY_LABELS: Record<CompetitionCategory, string> =
  {
    words: "Наголоси",
    idioms: "Фразеологізми",
    history: "Історія дати",
    terms: "Терміни",
    nmt: "НМТ тести",
  }

export const COMPETITION_GROUPS: Record<
  CompetitionCategory,
  { id: number; name: string }[]
> = {
  words: GROUPS.map((group) => ({ id: group.id, name: group.name })),
  idioms: IDIOM_GROUPS.map((group) => ({ id: group.id, name: group.name })),
  history: HISTORY_GROUPS.map((group) => ({ id: group.id, name: group.name })),
  terms: TERM_GROUPS.map((group) => ({ id: group.id, name: group.name })),
  nmt: NMT_SUBJECTS.map((subject, index) => ({
    id: index,
    name: subject.label,
  })),
}

function nmtSubjectForGroupId(groupId: number | "all"): NmtSubjectId[] {
  if (groupId === "all") return NMT_SUBJECTS.map((subject) => subject.id)
  const subject = NMT_SUBJECTS[groupId]
  return subject ? [subject.id] : []
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
    case "nmt":
      // NMT questions are built asynchronously from lazy-loaded exam chunks.
      return []
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

/**
 * NMT exams live in lazy-loaded chunks, so questions for this category are
 * built asynchronously. Only one-answer, text-only tasks are used — the
 * multiplayer UI shows a single choice per question.
 */
export async function buildNmtCompetitionQuestions(
  config: CompetitionConfig
): Promise<CompetitionQuestion[]> {
  const requested = Math.min(Math.max(Math.round(config.questionCount), 1), 30)
  const subjects = nmtSubjectForGroupId(config.groupId)
  const exams = (await Promise.all(subjects.map(loadNmtExams))).flat()
  const questions: CompetitionQuestion[] = []

  for (const exam of exams) {
    for (const question of shuffleArray(exam.questions)) {
      if (questions.length >= requested) break
      if (question.type !== "single" || question.imageUrl) continue
      if (question.question.length > 500) continue
      if (question.options.length < 2 || question.correct.length !== 1) continue

      const correct = question.options.find(
        (option) => option.key === question.correct[0]
      )
      if (!correct) continue

      const options = shuffleArray(
        question.options.map((option) => option.text)
      )
      if (new Set(options).size !== options.length) continue

      questions.push({
        prompt: question.question,
        options,
        correctIndex: options.indexOf(correct.text),
      })
    }
  }

  return shuffleArray(questions).slice(0, requested)
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
    case "nmt":
      // Built by buildNmtCompetitionQuestions (needs lazy-loaded exam data).
      return []
  }
}
