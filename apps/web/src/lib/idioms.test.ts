import { describe, expect, it } from "vitest"
import { parseIdiom, buildQuizOptions, IDIOM_ENTRIES } from "./idioms"

describe("parseIdiom", () => {
  it("splits idiom and definition on the en-dash", () => {
    expect(
      parseIdiom("Ахіллесова п'ята – дошкульне місце, вразлива сторона")
    ).toEqual({
      idiom: "Ахіллесова п'ята",
      definition: "дошкульне місце, вразлива сторона",
    })
  })

  it("trims surrounding whitespace", () => {
    expect(parseIdiom("  Бити байдики  –  бути без діла  ")).toEqual({
      idiom: "Бити байдики",
      definition: "бути без діла",
    })
  })

  it("preserves punctuation inside the definition", () => {
    expect(
      parseIdiom("Гнути кирпу – гордовито триматися; зазнаватися").definition
    ).toBe("гордовито триматися; зазнаватися")
  })

  it("returns empty definition when no separator", () => {
    expect(parseIdiom("Якийсь фразеологізм")).toEqual({
      idiom: "Якийсь фразеологізм",
      definition: "",
    })
  })
})

describe("IDIOM_ENTRIES", () => {
  it("has a definition for every idiom", () => {
    for (const entry of IDIOM_ENTRIES) {
      expect(entry.definition.length).toBeGreaterThan(0)
    }
  })
})

describe("buildQuizOptions", () => {
  it("includes the correct definition", () => {
    const definition = "бути без діла, весело проводити час"
    const options = buildQuizOptions(definition)
    expect(options).toContain(definition)
  })

  it("returns the requested number of unique options", () => {
    for (let i = 0; i < 20; i++) {
      const options = buildQuizOptions(IDIOM_ENTRIES[0].definition)
      expect(options).toHaveLength(4)
      expect(new Set(options).size).toBe(4)
    }
  })

  it("never includes the correct definition twice as a distractor", () => {
    for (const entry of IDIOM_ENTRIES) {
      for (let i = 0; i < 5; i++) {
        const options = buildQuizOptions(entry.definition)
        expect(options.filter((o) => o === entry.definition)).toHaveLength(1)
      }
    }
  })
})
