import { describe, expect, it } from "vitest"
import { IDIOMS_RAW } from "./idioms"
import { parseIdiom } from "@/lib/idioms"

describe("IDIOMS_RAW dataset", () => {
  it("every entry splits into a non-empty idiom and definition", () => {
    const issues: { index: number; raw: string }[] = []

    IDIOMS_RAW.forEach((raw, i) => {
      const { idiom, definition } = parseIdiom(raw)
      if (idiom.length === 0 || definition.length === 0) {
        issues.push({ index: i, raw })
      }
    })

    expect(issues).toEqual([])
  })

  it("has no duplicate idioms", () => {
    const seen = new Map<string, number[]>()
    IDIOMS_RAW.forEach((raw, i) => {
      const { idiom } = parseIdiom(raw)
      const existing = seen.get(idiom) ?? []
      existing.push(i)
      seen.set(idiom, existing)
    })

    const duplicates = Array.from(seen.entries()).filter(
      ([, indices]) => indices.length > 1
    )
    expect(duplicates).toEqual([])
  })

  it("has no leading or trailing whitespace in idiom or definition", () => {
    const issues: string[] = []

    IDIOMS_RAW.forEach((raw, i) => {
      const { idiom, definition } = parseIdiom(raw)
      if (idiom !== idiom.trim() || definition !== definition.trim()) {
        issues.push(`${i}: "${raw}"`)
      }
    })

    expect(issues, issues.join("\n")).toEqual([])
  })
})
