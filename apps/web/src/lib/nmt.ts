export type NmtSubjectId =
  "ukrainian" | "history" | "geography" | "math" | "english"

export type NmtQuestionType = "single" | "multi"

export interface NmtOption {
  key: string
  text: string
}

export interface NmtQuestion {
  id: string
  type: NmtQuestionType
  question: string
  imageUrl?: string
  options: NmtOption[]
  correct: string[]
}

export interface NmtExam {
  id: string
  subject: NmtSubjectId
  title: string
  year: number
  kind: "nmt" | "zno"
  variant: string
  /** Number of tasks in the original exam form (our practice set is shorter). */
  originalQuestionCount: number
  sourceUrl: string | null
  questions: NmtQuestion[]
}

export const NMT_SUBJECTS: {
  id: NmtSubjectId
  label: string
  description: string
}[] = [
  {
    id: "ukrainian",
    label: "Українська мова",
    description: "ЗНО та НМТ з української мови й літератури",
  },
  {
    id: "history",
    label: "Історія України",
    description: "ЗНО та НМТ з історії України",
  },
  {
    id: "geography",
    label: "Географія",
    description: "ЗНО та НМТ з географії",
  },
  {
    id: "math",
    label: "Математика",
    description: "ЗНО та НМТ з математики",
  },
  {
    id: "english",
    label: "Англійська мова",
    description: "ЗНО та НМТ з англійської мови",
  },
]

export function nmtSubjectLabel(id: NmtSubjectId): string {
  return NMT_SUBJECTS.find((subject) => subject.id === id)?.label ?? id
}

export function isNmtSubjectId(value: unknown): value is NmtSubjectId {
  return (
    typeof value === "string" &&
    NMT_SUBJECTS.some((subject) => subject.id === value)
  )
}

export function isNmtAnswerCorrect(
  question: NmtQuestion,
  selected: string[]
): boolean {
  if (selected.length !== question.correct.length) return false
  return question.correct.every((key) => selected.includes(key))
}
