import { describe, expect, it } from "vitest"
import { VISUAL_HISTORY_ITEMS } from "@/data/visual-history"
import { buildVisualHistoryQuizOptions } from "./visual-history"

describe("buildVisualHistoryQuizOptions", () => {
  it("includes the correct name", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      const options = buildVisualHistoryQuizOptions(item.name, item.category)
      expect(options).toContain(item.name)
    }
  })

  it("returns the requested number of unique options", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      const options = buildVisualHistoryQuizOptions(item.name, item.category)
      expect(options).toHaveLength(4)
      expect(new Set(options).size).toBe(4)
    }
  })

  it("never includes the correct name twice", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      for (let i = 0; i < 3; i++) {
        const options = buildVisualHistoryQuizOptions(item.name, item.category)
        expect(options.filter((o) => o === item.name)).toHaveLength(1)
      }
    }
  })

  it("picks distractors from the same category", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      for (let i = 0; i < 3; i++) {
        const options = buildVisualHistoryQuizOptions(item.name, item.category)
        for (const option of options) {
          if (option === item.name) continue
          const found = VISUAL_HISTORY_ITEMS.find((it) => it.name === option)
          expect(found, `${option} not found in dataset`).toBeDefined()
          expect(found?.category, `${option} in wrong category`).toBe(
            item.category
          )
        }
      }
    }
  })
})