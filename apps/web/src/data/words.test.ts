import { describe, expect, it } from "vitest"
import { WORDS_RAW } from "./words"
import { parseWord } from "@/lib/stress"

const UKRAINIAN_UPPER = new Set(
  "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ".split(""),
)

interface RawEntry {
  raw: string
  wordPart: string
  explanation: string | null
}

interface ParsedEntry {
  text: string
  stressIndices: number[]
  explanation: string | null
  raw: string
}

function extractExplanation(raw: string): RawEntry {
  const match = raw.match(/^(.+?)\s*\((.+?)\)\s*$/)
  if (match) {
    return { raw, wordPart: match[1].trim(), explanation: match[2].trim() }
  }
  return { raw, wordPart: raw.trim(), explanation: null }
}

function isUppercase(ch: string): boolean {
  return UKRAINIAN_UPPER.has(ch)
}

function countUppercaseOutsideParens(raw: string): number {
  let depth = 0
  let count = 0
  for (const ch of raw) {
    if (ch === "(") depth++
    else if (ch === ")") depth--
    else if (depth === 0 && isUppercase(ch)) count++
  }
  return count
}

function parseEntries(): ParsedEntry[] {
  const result: ParsedEntry[] = []

  for (const raw of WORDS_RAW) {
    const { wordPart, explanation } = extractExplanation(raw)

    const parts = wordPart.split(",").map((s) => s.trim()).filter(Boolean)

    for (const part of parts) {
      const parsed = parseWord(part)
      result.push({
        text: parsed.text,
        stressIndices: parsed.stressIndices,
        explanation,
        raw: part,
      })
    }
  }

  return result
}

describe("WORDS_RAW dataset", () => {
  it("every entry has at least one uppercase outside parentheses (stress marker)", () => {
    const missing: { index: number; raw: string }[] = []

    WORDS_RAW.forEach((raw, i) => {
      if (countUppercaseOutsideParens(raw) === 0) {
        missing.push({ index: i, raw })
      }
    })

    expect(missing).toEqual([])
  })

  it("parseWord succeeds for every word part", () => {
    const entries = parseEntries()
    for (const entry of entries) {
      expect(entry.text.length).toBeGreaterThan(0)
      expect(entry.stressIndices.length).toBeGreaterThanOrEqual(0)
    }
  })

  it("stressIndices are within text bounds for every parsed word", () => {
    const entries = parseEntries()
    for (const entry of entries) {
      for (const idx of entry.stressIndices) {
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(entry.text.length)
      }
    }
  })

  it("homonyms (same text, different stress) have explanations", () => {
    const entries = parseEntries()

    const groups = new Map<string, ParsedEntry[]>()
    for (const entry of entries) {
      const existing = groups.get(entry.text) ?? []
      existing.push(entry)
      groups.set(entry.text, existing)
    }

    const issues: string[] = []

    for (const [text, group] of groups) {
      const uniqueStresses = new Set(
        group.map((e) => JSON.stringify(e.stressIndices)),
      )
      if (uniqueStresses.size <= 1) continue

      for (const entry of group) {
        if (!entry.explanation) {
          issues.push(
            `"${entry.raw}" — омонім до "${text}" з наголосом ${JSON.stringify(entry.stressIndices)} без пояснення`,
          )
        }
      }
    }

    expect(issues, issues.join("\n")).toEqual([])
  })

  it("every parsed word is valid Ukrainian text", () => {
    const UKRAINIAN_LOWER = new Set(
      "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя-'’".split(""),
    )

    const entries = parseEntries()
    const invalid: string[] = []

    for (const entry of entries) {
      for (const ch of entry.text) {
        if (!UKRAINIAN_LOWER.has(ch)) {
          invalid.push(`"${entry.raw}" → "${entry.text}" має неочікуваний символ "${ch}"`)
          break
        }
      }
    }

    expect(invalid, invalid.join("\n")).toEqual([])
  })
})
