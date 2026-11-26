import { describe, expect, it } from "vitest"
import { NMT_EXAMS as ukrainian } from "@/data/nmt-ukrainian"
import { NMT_EXAMS as history } from "@/data/nmt-history"
import { NMT_EXAMS as geography } from "@/data/nmt-geography"
import { NMT_EXAMS as math } from "@/data/nmt-math"
import { NMT_EXAMS as english } from "@/data/nmt-english"
import { isNmtAnswerCorrect, type NmtExam, type NmtSubjectId } from "@/lib/nmt"

const bySubject: { subject: NmtSubjectId; exams: NmtExam[] }[] = [
  { subject: "ukrainian", exams: ukrainian },
  { subject: "history", exams: history },
  { subject: "geography", exams: geography },
  { subject: "math", exams: math },
  { subject: "english", exams: english },
]

describe("nmt exam data", () => {
  it("has a large number of exams", () => {
    const total = bySubject.reduce((sum, group) => sum + group.exams.length, 0)
    expect(total).toBe(184)
  })

  it("has unique exam ids", () => {
    const ids = bySubject.flatMap((group) => group.exams.map((exam) => exam.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(bySubject)(
    "$subject exams have valid questions",
    ({ subject, exams }) => {
      expect(exams.length).toBeGreaterThan(0)

      for (const exam of exams) {
        expect(exam.id.startsWith(subject)).toBe(true)
        expect(exam.title.length).toBeGreaterThan(0)
        expect(exam.year).toBeGreaterThan(2000)
        expect(exam.originalQuestionCount).toBeGreaterThanOrEqual(
          exam.questions.length
        )
        expect(exam.questions.length).toBeGreaterThan(0)

        for (const question of exam.questions) {
          expect(question.question.trim().length).toBeGreaterThan(0)
          expect(question.options.length).toBeGreaterThanOrEqual(2)
          expect(question.correct.length).toBeGreaterThan(0)

          const keys = question.options.map((option) => option.key)
          expect(new Set(keys).size).toBe(keys.length)
          for (const key of question.correct) {
            expect(keys).toContain(key)
          }
          for (const option of question.options) {
            expect(option.text.trim().length).toBeGreaterThan(0)
          }
        }
      }
    }
  )
})

describe("isNmtAnswerCorrect", () => {
  const question = {
    id: "q",
    type: "multi" as const,
    question: "?",
    options: [
      { key: "1", text: "a" },
      { key: "2", text: "b" },
      { key: "3", text: "c" },
    ],
    correct: ["1", "3"],
  }

  it("accepts the exact correct set in any order", () => {
    expect(isNmtAnswerCorrect(question, ["1", "3"])).toBe(true)
    expect(isNmtAnswerCorrect(question, ["3", "1"])).toBe(true)
  })

  it("rejects missing or extra answers", () => {
    expect(isNmtAnswerCorrect(question, ["1"])).toBe(false)
    expect(isNmtAnswerCorrect(question, ["1", "2", "3"])).toBe(false)
    expect(isNmtAnswerCorrect(question, [])).toBe(false)
  })
})
