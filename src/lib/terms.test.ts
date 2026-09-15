import { describe, expect, it } from "vitest"
import { parseTerm, TERM_ENTRIES } from "./terms"
import { buildMatchOptions, matchAnswer, matchPrompt } from "./match"

describe("parseTerm", () => {
  it("splits term and definition on the en-dash", () => {
    expect(parseTerm("полюддя – форма збору данини на Русі")).toEqual({
      item: "полюддя",
      definition: "форма збору данини на Русі",
    })
  })

  it("trims surrounding whitespace", () => {
    expect(parseTerm("  віче  –  збори жителів міста  ")).toEqual({
      item: "віче",
      definition: "збори жителів міста",
    })
  })

  it("preserves punctuation inside the definition", () => {
    expect(parseTerm("віче – збори міста: голова, старшина").definition).toBe(
      "збори міста: голова, старшина"
    )
  })

  it("preserves the en-dash inside the term", () => {
    expect(parseTerm("бронзовий вік – доба використання бронзи").item).toBe(
      "бронзовий вік"
    )
  })
})

describe("TERM_ENTRIES", () => {
  it("has a definition for every term", () => {
    for (const entry of TERM_ENTRIES) {
      expect(entry.definition.length).toBeGreaterThan(0)
    }
  })
})

describe("buildMatchOptions", () => {
  const entries = TERM_ENTRIES
  const entry = entries[0]

  it("mode item-to-definition: includes correct definition", () => {
    const options = buildMatchOptions(entries, entry, "item-to-definition")
    expect(options).toContain(entry.definition)
    expect(matchAnswer(entry, "item-to-definition")).toBe(entry.definition)
    expect(matchPrompt(entry, "item-to-definition")).toBe(entry.item)
  })

  it("mode definition-to-item: includes correct term", () => {
    const options = buildMatchOptions(entries, entry, "definition-to-item")
    expect(options).toContain(entry.item)
    expect(matchAnswer(entry, "definition-to-item")).toBe(entry.item)
    expect(matchPrompt(entry, "definition-to-item")).toBe(entry.definition)
  })

  it("returns 4 unique options in both modes", () => {
    for (const mode of ["item-to-definition", "definition-to-item"] as const) {
      for (let i = 0; i < 20; i++) {
        const options = buildMatchOptions(entries, entries[0], mode)
        expect(options).toHaveLength(4)
        expect(new Set(options).size).toBe(4)
      }
    }
  })

  it("limits distractors to the provided distractor pool", () => {
    const pool = entries.slice(0, 8)
    for (const mode of ["item-to-definition", "definition-to-item"] as const) {
      const poolAnswers = new Set(pool.map((e) => matchAnswer(e, mode)))
      const correctOption = matchAnswer(entries[0], mode)
      expect(poolAnswers.has(correctOption)).toBe(true)

      for (let i = 0; i < 20; i++) {
        const options = buildMatchOptions(entries, entries[0], mode, 4, pool)
        expect(options).toHaveLength(4)
        for (const option of options) {
          expect(poolAnswers.has(option)).toBe(true)
        }
        expect(options.filter((o) => o === correctOption)).toHaveLength(1)
      }
    }
  })

  it("never includes the correct option twice as a distractor", () => {
    for (const mode of ["item-to-definition", "definition-to-item"] as const) {
      for (const candidate of entries) {
        for (let i = 0; i < 5; i++) {
          const options = buildMatchOptions(entries, candidate, mode)
          const correctOption = matchAnswer(candidate, mode)
          expect(options.filter((o) => o === correctOption)).toHaveLength(1)
        }
      }
    }
  })
})
