import { describe, it, expect } from "vitest"
import { VISUAL_HISTORY_ITEMS } from "./visual-history"
import { VISUAL_HISTORY_GROUPS } from "./visual-history-groups"

describe("visual-history", () => {
  it("has items", () => {
    expect(VISUAL_HISTORY_ITEMS.length).toBeGreaterThan(0)
  })

  it("every item has a name", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      expect(item.name).toBeTruthy()
    }
  })

  it("every item has a unique name", () => {
    const names = VISUAL_HISTORY_ITEMS.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("no item name contains HTML tags or entities", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      expect(item.name).not.toMatch(/<[^>]+>/)
      expect(item.name).not.toMatch(/&[a-z]+;/)
      expect(item.name).not.toMatch(/&#\d+;/)
    }
  })

  it("every item has an imageUrl", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      expect(item.imageUrl).toBeTruthy()
      expect(item.imageUrl).toMatch(/^\/images\/visual-history\//)
    }
  })

  it("every item has a category", () => {
    for (const item of VISUAL_HISTORY_ITEMS) {
      expect(item.category).toBeTruthy()
    }
  })

  it("every item has a unique id", () => {
    const ids = VISUAL_HISTORY_ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("visual-history-groups", () => {
  it("has groups", () => {
    expect(VISUAL_HISTORY_GROUPS.length).toBeGreaterThan(0)
  })

  it("every group has a name", () => {
    for (const group of VISUAL_HISTORY_GROUPS) {
      expect(group.name).toBeTruthy()
    }
  })

  it("every group has itemIndices", () => {
    for (const group of VISUAL_HISTORY_GROUPS) {
      expect(group.itemIndices.length).toBeGreaterThan(0)
    }
  })

  it("group itemIndices point to valid items", () => {
    for (const group of VISUAL_HISTORY_GROUPS) {
      for (const idx of group.itemIndices) {
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(VISUAL_HISTORY_ITEMS.length)
      }
    }
  })

  it("every item belongs to exactly one group", () => {
    const allIndices = VISUAL_HISTORY_GROUPS.flatMap((g) => g.itemIndices)
    expect(new Set(allIndices).size).toBe(VISUAL_HISTORY_ITEMS.length)
  })
})
