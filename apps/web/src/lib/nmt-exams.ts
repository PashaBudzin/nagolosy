import {
  isNmtSubjectId,
  nmtSubjectLabel,
  type NmtExam,
  type NmtSubjectId,
} from "@/lib/nmt"
import { shuffleArray } from "@/lib/stress"

type ExamModule = { NMT_EXAMS: NmtExam[] }

const loaders: Record<NmtSubjectId, () => Promise<ExamModule>> = {
  ukrainian: () => import("@/data/nmt-ukrainian"),
  history: () => import("@/data/nmt-history"),
  geography: () => import("@/data/nmt-geography"),
  math: () => import("@/data/nmt-math"),
  english: () => import("@/data/nmt-english"),
}

const cache = new Map<NmtSubjectId, NmtExam[]>()

/** Exams are large, so each subject is loaded as a separate lazy chunk. */
export async function loadNmtExams(subject: NmtSubjectId): Promise<NmtExam[]> {
  const cached = cache.get(subject)
  if (cached) return cached

  const exams = (await loaders[subject]()).NMT_EXAMS
  cache.set(subject, exams)
  return exams
}

export function subjectFromExamId(id: string): NmtSubjectId | null {
  const subject = id.split("-")[0]
  return isNmtSubjectId(subject) ? subject : null
}

/** A short, mixed practice session drawn from every exam of one subject. */
export function buildQuickExam(exams: NmtExam[], count: number): NmtExam {
  const subject = exams[0]?.subject ?? "ukrainian"
  const questions = shuffleArray(exams.flatMap((exam) => exam.questions)).slice(
    0,
    count
  )

  return {
    id: `${subject}-quick-${Date.now()}`,
    subject,
    title: `Швидка сесія · ${nmtSubjectLabel(subject)}`,
    year: new Date().getFullYear(),
    kind: "nmt",
    variant: "quick",
    originalQuestionCount: questions.length,
    sourceUrl: null,
    questions,
  }
}

export async function findNmtExam(id: string): Promise<NmtExam | null> {
  const subject = subjectFromExamId(id)
  if (!subject) return null

  const exams = await loadNmtExams(subject)
  return exams.find((exam) => exam.id === id) ?? null
}
