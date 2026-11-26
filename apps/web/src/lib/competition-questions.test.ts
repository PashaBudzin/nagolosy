import { describe, expect, it } from "vitest"
import { IDIOM_GROUPS } from "@/data/idiom-groups"
import { IDIOM_ENTRIES } from "@/lib/idioms"
import { HISTORY_ENTRIES } from "@/lib/history"
import { TERM_ENTRIES } from "@/lib/terms"
import { WORDS_RAW } from "@/data/words"
import { getWordData } from "@/lib/stress"
import {
  COMPETITION_CATEGORIES,
  buildCompetitionQuestions,
} from "@/lib/competition-questions"
import type {
  CompetitionCategory,
  CompetitionConfig,
  CompetitionQuestion,
} from "@/lib/competition-types"

function config(category: CompetitionCategory): CompetitionConfig {
  return {
    category,
    groupId: "all",
    questionCount: 10,
    timePerQuestionMs: 15_000,
  }
}

function expectValidQuestions(questions: CompetitionQuestion[], count: number) {
  expect(questions).toHaveLength(count)
  for (const question of questions) {
    expect(question.prompt.length).toBeGreaterThan(0)
    expect(question.options.length).toBeGreaterThanOrEqual(2)
    expect(new Set(question.options).size).toBe(question.options.length)
    expect(question.correctIndex).toBeGreaterThanOrEqual(0)
    expect(question.correctIndex).toBeLessThan(question.options.length)
  }
}

describe("buildCompetitionQuestions", () => {
  it("builds the requested number of questions for every category", () => {
    for (const category of COMPETITION_CATEGORIES) {
      expectValidQuestions(buildCompetitionQuestions(config(category.id)), 10)
    }
  })

  it("uses the same correct answer shape as the regular quizzes", () => {
    const idioms = buildCompetitionQuestions(config("idioms"))
    for (const question of idioms) {
      const entry = IDIOM_ENTRIES.find((item) => item.idiom === question.prompt)
      expect(entry).toBeDefined()
      expect(question.options[question.correctIndex]).toBe(entry?.definition)
    }

    const history = buildCompetitionQuestions(config("history"))
    for (const question of history) {
      const entry = HISTORY_ENTRIES.find(
        (item) => item.event === question.prompt
      )
      expect(entry).toBeDefined()
      expect(question.options[question.correctIndex]).toBe(entry?.date)
    }

    const terms = buildCompetitionQuestions(config("terms"))
    for (const question of terms) {
      const entry = TERM_ENTRIES.find((item) => item.item === question.prompt)
      expect(entry).toBeDefined()
      expect(question.options[question.correctIndex]).toBe(entry?.definition)
    }
  })

  it("builds word questions whose options move the stress mark", () => {
    const questions = buildCompetitionQuestions(config("words"))
    expectValidQuestions(questions, 10)

    for (const question of questions) {
      const entry = WORDS_RAW.map(getWordData).find(
        (word) => word.text === question.prompt
      )
      expect(entry).toBeDefined()
      expect(entry?.stressIndices).toHaveLength(1)
      expect(question.options[question.correctIndex]).toContain("\u0301")
    }
  })

  it("honours a selected group", () => {
    const group = IDIOM_GROUPS[0]
    const groupConfig: CompetitionConfig = {
      ...config("idioms"),
      groupId: group.id,
      questionCount: 5,
    }
    const questions = buildCompetitionQuestions(groupConfig)
    expectValidQuestions(questions, 5)

    const groupPrompts = new Set(
      group.idiomIndices.map((index) => IDIOM_ENTRIES[index].idiom)
    )
    for (const question of questions) {
      expect(groupPrompts.has(question.prompt)).toBe(true)
    }
  })
})
