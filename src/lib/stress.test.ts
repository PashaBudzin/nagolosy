import { describe, expect, it } from "vitest"
import { parseWord, displayWord, getWordData } from "./stress"

describe("parseWord", () => {
  it("extracts a single stress index", () => {
    expect(parseWord("агронОмія")).toEqual({
      text: "агрономія",
      stressIndices: [5],
      explanation: undefined,
    })
  })

  it("treats single first-letter uppercase as stress (ambiguous)", () => {
    expect(parseWord("Аркушик")).toEqual({
      text: "аркушик",
      stressIndices: [0],
      explanation: undefined,
    })
  })

  it("distinguishes first-letter cap from real stress when another uppercase exists", () => {
    const result = parseWord("Олень")
    expect(result.text).toBe("олень")
    expect(result.stressIndices).toEqual([0])
  })

  it("handles compound stress (multiple stressed vowels)", () => {
    expect(parseWord("алфАвІт")).toEqual({
      text: "алфавіт",
      stressIndices: [3, 5],
      explanation: undefined,
    })
  })

  it("handles compound stress — removes first-letter cap when another stress exists", () => {
    const result = parseWord("алфАвІт")
    expect(result.stressIndices).toEqual([3, 5])
  })

  it("strips parenthetical content from text", () => {
    expect(parseWord("де-Юре").text).toBe("де-юре")
  })

  it("trims whitespace", () => {
    expect(parseWord("  бЕшкет ").text).toBe("бешкет")
  })

  it("preserves non-letter characters (hyphen, apostrophe)", () => {
    const result = parseWord("тім'яний")
    expect(result.text).toContain("'")
  })

  it("extracts explanation from parenthetical content", () => {
    expect(parseWord("вИгода (користь)")).toEqual({
      text: "вигода",
      stressIndices: [1],
      explanation: "користь",
    })
  })

  it("extracts multi-word explanation", () => {
    expect(parseWord("хАос (у міфології: стихія)")).toEqual({
      text: "хаос",
      stressIndices: [1],
      explanation: "у міфології: стихія",
    })
  })

  it("returns undefined explanation when no parentheses", () => {
    expect(parseWord("бЕшкет").explanation).toBeUndefined()
  })
})

describe("getWordData", () => {
  it("is an alias for parseWord", () => {
    expect(getWordData("близькИй")).toEqual(parseWord("близькИй"))
  })
})

describe("displayWord", () => {
  it("inserts combining acute after the stressed vowel", () => {
    expect(displayWord("агрономія", [5])).toBe("агроно\u0301мія")
  })

  it("inserts acute after each stressed vowel for compound stress", () => {
    expect(displayWord("алфавіт", [3, 5])).toBe("алфа\u0301ві\u0301т")
  })

  it("returns the word unchanged when no stress indices", () => {
    expect(displayWord("аркушик", [])).toBe("аркушик")
  })

  it("inserts acute after the stressed vowel (including first char)", () => {
    expect(displayWord("абажур", [0])).toBe("а\u0301бажур")
  })
})
