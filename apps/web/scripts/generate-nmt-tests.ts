#!/usr/bin/env bun

/**
 * Regenerates src/data/nmt-*.ts from the ZNO-Eval dataset.
 *
 * Source: https://huggingface.co/datasets/NLPForUA/zno-eval
 * Only text-only, single/multi-choice tasks with a known answer key are kept.
 *
 * ⚠️ The exam content itself is third-party material created for UCEQA (УЦОЯО).
 * The dataset maintainers do NOT license it — see the dataset LICENSE. Before
 * publishing this data in a product, obtain permission from the rights holders
 * or rely on an applicable educational-use exception, and keep the attribution.
 *
 * Usage: bun run apps/web/scripts/generate-nmt-tests.ts
 */

import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

const BASE =
  "https://huggingface.co/datasets/NLPForUA/zno-eval/resolve/main/data"
const OUT_DIR = join(import.meta.dir, "..", "src", "data")

const SUBJECTS = {
  ukrainian: "Українська мова",
  history: "Історія України",
  geography: "Географія",
  math: "Математика",
} as const

type SubjectId = keyof typeof SUBJECTS
type OutputSubjectId = SubjectId | "literature"

/** Ukrainian exams are split by their source assessment section. */
const OUTPUT_SUBJECTS: {
  id: OutputSubjectId
  source: string
  section?: string
}[] = [
  { id: "ukrainian", source: "ukrainian", section: "language" },
  { id: "literature", source: "ukrainian", section: "literature" },
  { id: "history", source: "history" },
  { id: "geography", source: "geography" },
  { id: "math", source: "math" },
]

const VARIANTS: Record<string, string> = {
  demo: "демоверсія",
  "demo-language": "демоверсія (мовний блок)",
  "demo-literature": "демоверсія (література)",
  main: "основна сесія",
  additional: "додаткова сесія",
  trial: "пробний тест",
  "trial-1": "пробний тест 1",
  "trial-2": "пробний тест 2",
  "session-1": "1 сесія",
  "session-2": "2 сесія",
  "session-3": "3 сесія",
}

interface ExamMeta {
  exam_uid: string
  subject: string
  exam_year: number
  exam_kind: string
  exam_variant: string
  exam_label_uk: string
  official_exam_page_url: string | null
  num_tasks: number
}

interface ExamRow {
  id: string
  subject: OutputSubjectId
  title: string
  year: number
  kind: string
  variant: string
  originalQuestionCount: number
  sourceUrl: string | null
  questions: Question[]
}

interface RawAnswer {
  answer: string
  text: string
}

interface RawTask {
  task_uid: string
  exam_uid: string
  question: string
  question_type: string
  answers: RawAnswer[]
  correct_answer: string[]
  assessment_section: string | null
  v1_text_benchmark_eligible: boolean
  v2_canonical_text_benchmark_eligible: boolean
  with_photo: boolean
}

interface Question {
  id: string
  type: "single" | "multi"
  question: string
  options: { key: string; text: string }[]
  correct: string[]
}

function clean(value: string): string {
  return value
    .replace(/\\\*/g, "*")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\r\n/g, "\n")
    .trim()
}

async function loadGzJsonLines(path: string): Promise<unknown[]> {
  const response = await fetch(`${BASE}/${path}`)
  if (!response.ok) {
    throw new Error(`Failed to download ${path}: ${response.status}`)
  }
  const bytes = Bun.gunzipSync(new Uint8Array(await response.arrayBuffer()))
  const text = new TextDecoder().decode(bytes)
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as unknown)
}

async function main() {
  const exams = (await loadGzJsonLines("exams/exams.jsonl.gz")) as ExamMeta[]
  const tasksByExam = new Map<string, RawTask[]>()

  for (const subject of Object.keys(SUBJECTS) as SubjectId[]) {
    const tasks = (await loadGzJsonLines(
      `tasks/${subject}.jsonl.gz`
    )) as RawTask[]
    for (const task of tasks) {
      const list = tasksByExam.get(task.exam_uid) ?? []
      list.push(task)
      tasksByExam.set(task.exam_uid, list)
    }
  }

  const rows: ExamRow[] = []

  for (const exam of exams) {
    if (!(exam.subject in SUBJECTS)) continue

    const kind = exam.exam_kind === "nmt" ? "НМТ" : "ЗНО"
    const variant = VARIANTS[exam.exam_variant] ?? exam.exam_variant
    const baseId = exam.exam_uid.replace(/:/g, "-")

    for (const output of OUTPUT_SUBJECTS) {
      if (output.source !== exam.subject) continue

      const questions: Question[] = []
      for (const task of tasksByExam.get(exam.exam_uid) ?? []) {
        if (output.section && task.assessment_section !== output.section) {
          continue
        }
        if (
          !task.v1_text_benchmark_eligible &&
          !task.v2_canonical_text_benchmark_eligible
        ) {
          continue
        }
        if (task.with_photo) continue
        if (
          task.question_type !== "single_choice" &&
          task.question_type !== "multi_select"
        ) {
          continue
        }

        const correct = task.correct_answer ?? []
        const keys = new Set(task.answers.map((answer) => answer.answer))
        if (correct.length === 0 || !correct.every((key) => keys.has(key)))
          continue

        const options = task.answers
          .map((answer) => ({ key: answer.answer, text: clean(answer.text) }))
          .filter((option) => option.text.length > 0)
        if (options.length < 2) continue

        questions.push({
          id: task.task_uid,
          type: task.question_type === "multi_select" ? "multi" : "single",
          question: clean(task.question),
          options,
          correct,
        })
      }

      if (questions.length === 0) continue

      rows.push({
        id:
          output.id === "literature"
            ? baseId.replace(/^ukrainian-/, "literature-")
            : baseId,
        subject: output.id,
        title:
          output.id === "literature"
            ? `${kind} ${exam.exam_year} · ${variant} (література)`
            : `${kind} ${exam.exam_year} · ${variant}`,
        year: exam.exam_year,
        kind: exam.exam_kind,
        variant: exam.exam_variant,
        originalQuestionCount: exam.num_tasks,
        sourceUrl: exam.official_exam_page_url,
        questions,
      })
    }
  }

  rows.sort(
    (a, b) =>
      b.year - a.year ||
      Number(a.kind !== "nmt") - Number(b.kind !== "nmt") ||
      a.title.localeCompare(b.title, "uk")
  )

  await mkdir(OUT_DIR, { recursive: true })

  for (const { id: subject } of OUTPUT_SUBJECTS) {
    const subjectRows = rows.filter((exam) => exam.subject === subject)
    const lines = [
      "// Generated by apps/web/scripts/generate-nmt-tests.ts — do not edit by hand.",
      "// Source: ZNO-Eval (NLPForUA/zno-eval). Exam content is third-party material.",
      'import type { NmtExam } from "@/lib/nmt"',
      "",
      "export const NMT_EXAMS: NmtExam[] = [",
    ]

    for (const exam of subjectRows) {
      lines.push(
        "  {",
        `    id: ${JSON.stringify(exam.id)},`,
        `    subject: ${JSON.stringify(exam.subject)},`,
        `    title: ${JSON.stringify(exam.title)},`,
        `    year: ${exam.year},`,
        `    kind: ${JSON.stringify(exam.kind)},`,
        `    variant: ${JSON.stringify(exam.variant)},`,
        `    originalQuestionCount: ${exam.originalQuestionCount},`,
        `    sourceUrl: ${JSON.stringify(exam.sourceUrl)},`,
        "    questions: ["
      )
      for (const question of exam.questions) {
        lines.push(
          "      {",
          `        id: ${JSON.stringify(question.id)},`,
          `        type: ${JSON.stringify(question.type)},`,
          `        question: ${JSON.stringify(question.question)},`,
          "        options: [",
          ...question.options.map(
            (option) =>
              `          { key: ${JSON.stringify(option.key)}, text: ${JSON.stringify(option.text)} },`
          ),
          "        ],",
          `        correct: [${question.correct.map((key) => JSON.stringify(key)).join(", ")}],`,
          "      },"
        )
      }
      lines.push("    ],", "  },")
    }
    lines.push("]")

    const path = join(OUT_DIR, `nmt-${subject}.ts`)
    await writeFile(path, `${lines.join("\n")}\n`, "utf8")
    console.log(
      `${subject}: ${subjectRows.length} exams, ${subjectRows.reduce((sum, exam) => sum + exam.questions.length, 0)} questions`
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
