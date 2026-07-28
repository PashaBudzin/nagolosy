import { describe, expect, it } from "vitest"
import { WORDS_RAW } from "./words"
import { parseWord } from "@/lib/stress"

const UKRAINIAN_UPPER = new Set(
  "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ".split(""),
)

describe("WORDS_RAW dataset", () => {
  it("every word has at least one uppercase letter (stress marker)", () => {
    const missing: { index: number; word: string }[] = []

    WORDS_RAW.forEach((word, i) => {
      const hasUpper = [...word].some(
        (ch) => UKRAINIAN_UPPER.has(ch),
      )
      if (!hasUpper) {
        missing.push({ index: i, word })
      }
    })

    expect(missing).toEqual([])
  })

  it("parseWord succeeds for every word", () => {
    WORDS_RAW.forEach((raw) => {
      const result = parseWord(raw)
      expect(result.text.length).toBeGreaterThan(0)
      expect(result.stressIndices.length).toBeGreaterThanOrEqual(0)
    })
  })

  it("stressIndices are within text bounds for every word", () => {
    WORDS_RAW.forEach((raw) => {
      const { text, stressIndices } = parseWord(raw)
      for (const idx of stressIndices) {
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(text.length)
      }
    })
  })
})
