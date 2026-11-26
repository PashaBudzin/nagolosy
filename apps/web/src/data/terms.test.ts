import { describe, expect, it } from "vitest"
import { TERMS_RAW } from "./terms"
import { TERM_GROUPS } from "./term-groups"
import { parseTerm } from "@/lib/terms"

describe("TERMS_RAW dataset", () => {
  it("every entry splits into a non-empty term and definition", () => {
    const issues: { index: number; raw: string }[] = []

    TERMS_RAW.forEach((raw, i) => {
      const { item, definition } = parseTerm(raw)
      if (item.length === 0 || definition.length === 0) {
        issues.push({ index: i, raw })
      }
    })

    expect(issues).toEqual([])
  })

  it("has no duplicate terms", () => {
    const seen = new Map<string, number[]>()
    TERMS_RAW.forEach((raw, i) => {
      const { item } = parseTerm(raw)
      const existing = seen.get(item) ?? []
      existing.push(i)
      seen.set(item, existing)
    })

    const duplicates = Array.from(seen.entries()).filter(
      ([, indices]) => indices.length > 1
    )
    expect(duplicates).toEqual([])
  })

  it("has no duplicate definitions", () => {
    const seen = new Map<string, number[]>()
    TERMS_RAW.forEach((raw, i) => {
      const { definition } = parseTerm(raw)
      const existing = seen.get(definition) ?? []
      existing.push(i)
      seen.set(definition, existing)
    })

    const duplicates = Array.from(seen.entries()).filter(
      ([, indices]) => indices.length > 1
    )
    expect(duplicates).toEqual([])
  })

  it("has no leading or trailing whitespace in term or definition", () => {
    const issues: string[] = []

    TERMS_RAW.forEach((raw, i) => {
      const { item, definition } = parseTerm(raw)
      if (item !== item.trim() || definition !== definition.trim()) {
        issues.push(`${i}: "${raw}"`)
      }
    })

    expect(issues, issues.join("\n")).toEqual([])
  })
})

describe("TERM_GROUPS dataset", () => {
  it("covers every entry exactly once across groups", () => {
    const seen = new Set<number>()
    let total = 0
    for (const group of TERM_GROUPS) {
      expect(group.termIndices.length).toBeGreaterThan(0)
      for (const idx of group.termIndices) {
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(TERMS_RAW.length)
        expect(seen.has(idx)).toBe(false)
        seen.add(idx)
        total++
      }
    }
    expect(total).toBe(TERMS_RAW.length)
  })
})
