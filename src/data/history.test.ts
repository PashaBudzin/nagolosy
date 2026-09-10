import { describe, expect, it } from "vitest"
import { HISTORY_FACTS } from "./history"
import { HISTORY_GROUPS } from "./history-groups"
import { dateEpoch } from "@/lib/history"

describe("HISTORY_FACTS dataset", () => {
  it("every entry has a non-empty date and event", () => {
    const issues: { index: number; date: string; event: string }[] = []
    HISTORY_FACTS.forEach((fact, i) => {
      if (fact.date.length === 0 || fact.event.length === 0) {
        issues.push({ index: i, date: fact.date, event: fact.event })
      }
    })
    expect(issues).toEqual([])
  })

  it("has no duplicate events", () => {
    const seen = new Map<string, number[]>()
    HISTORY_FACTS.forEach((fact, i) => {
      const existing = seen.get(fact.event) ?? []
      existing.push(i)
      seen.set(fact.event, existing)
    })
    const duplicates = Array.from(seen.entries()).filter(
      ([, indices]) => indices.length > 1
    )
    expect(duplicates).toEqual([])
  })

  it("every date parses to a numeric epoch", () => {
    const unparsed: { index: number; date: string }[] = []
    HISTORY_FACTS.forEach((fact, i) => {
      if (dateEpoch(fact.date) === null) {
        unparsed.push({ index: i, date: fact.date })
      }
    })
    expect(unparsed).toEqual([])
  })
})

describe("HISTORY_GROUPS dataset", () => {
  it("covers every entry exactly once across groups", () => {
    const seen = new Set<number>()
    let total = 0
    for (const group of HISTORY_GROUPS) {
      expect(group.historyIndices.length).toBeGreaterThan(0)
      for (const idx of group.historyIndices) {
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(HISTORY_FACTS.length)
        expect(seen.has(idx)).toBe(false)
        seen.add(idx)
        total++
      }
    }
    expect(total).toBe(HISTORY_FACTS.length)
  })
})
