import { describe, expect, it } from "vitest"
import { dateEpoch, buildHistoryQuizOptions, HISTORY_ENTRIES } from "./history"

describe("dateEpoch", () => {
  const cases: [string, number][] = [
    ["1 млн років тому", -1_000_000],
    ["IV – середина III тис. до н. е.", -3_500],
    ["IX–VII ст. до н. е.", -750],
    ["480 р. до н. е.", -480],
    ["VII–III ст. до н. е. (ІІІ н. е.)", -450],
    ["ІІІ ст.", 250],
    ["Друга половина V – VII ст.", 550],
    ["IX–XII ст.", 1000],
    ["860", 860],
    ["882–912", 897],
    ["907, 911, 941, 944", 925.5],
    ["1019р.–1054", 1036.5],
    ["988", 988],
    ["травень 1648", 1648.33],
    ["25 жовтня (7 листопада) 1917", 1917 + (0.75 + 0.83) / 2],
    ["19 лютого 1861", 1861 + 0.08],
    ["грудень 1825 – січень 1826", (1825 + 0.92 + 1826 + 0) / 2],
    ["1928/29–1932", 1930],
    ["1830-ті – 1880-ті", 1855],
    ["початок 1860-х", 1860],
    ["40-ві роки XV ст. (1449)", 1450],
    ["967–968, 969–971", 969],
  ]

  it("maps dates to numeric epochs", () => {
    for (const [input, expected] of cases) {
      const got = dateEpoch(input)
      expect(got, `dateEpoch("${input}")`).not.toBeNull()
      expect(Math.abs((got as number) - expected)).toBeLessThan(1e-6)
    }
  })

  it("returns null for empty input", () => {
    expect(dateEpoch("")).toBeNull()
  })
})

describe("buildHistoryQuizOptions", () => {
  it("includes the correct date", () => {
    for (const entry of HISTORY_ENTRIES.slice(0, 50)) {
      const options = buildHistoryQuizOptions(entry.date)
      expect(options).toContain(entry.date)
    }
  })

  it("returns the requested number of unique options", () => {
    for (let i = 0; i < 20; i++) {
      const options = buildHistoryQuizOptions("988")
      expect(options).toHaveLength(4)
      expect(new Set(options).size).toBe(4)
    }
  })

  it("never includes the correct date twice", () => {
    for (const entry of HISTORY_ENTRIES) {
      for (let i = 0; i < 3; i++) {
        const options = buildHistoryQuizOptions(entry.date)
        expect(options.filter((o) => o === entry.date)).toHaveLength(1)
      }
    }
  })

  it("picks plausible (chronologically close) distractors", () => {
    for (const entry of HISTORY_ENTRIES) {
      const correct = dateEpoch(entry.date)
      if (correct === null) continue
      for (let i = 0; i < 3; i++) {
        const options = buildHistoryQuizOptions(entry.date)
        for (const option of options) {
          if (option === entry.date) continue
          const epoch = dateEpoch(option)
          if (epoch === null) continue
          // distractors should not be absurdly far from the correct date
          expect(
            Math.abs(epoch - correct),
            `${entry.date} vs ${option}`
          ).toBeLessThanOrEqual(2_000_000)
        }
      }
    }
  })
})
