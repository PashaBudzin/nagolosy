#!/usr/bin/env bun

/**
 * Generates src/data/nmt-english.ts from the English ЗНО/НМТ tests published on
 * zno.osvita.ua. Correct answers are read from each question's answer key.
 * Question images are downloaded into public/images/nmt/.
 *
 * ⚠️ Exam content is third-party material. Keep the attribution on the credits
 * page and confirm the educational-use exception before publishing.
 *
 * Usage: bun run apps/web/scripts/generate-nmt-english.ts
 */

import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

const SITE = "https://zno.osvita.ua"
const DATA_DIR = join(import.meta.dir, "..", "src", "data")
const IMAGES_DIR = join(import.meta.dir, "..", "public", "images", "nmt")

interface Question {
  id: string
  type: "single" | "multi"
  question: string
  options: { key: string; text: string }[]
  correct: string[]
  imageUrl?: string
}

interface Exam {
  id: string
  subject: "english"
  title: string
  year: number
  kind: "nmt" | "zno"
  variant: string
  originalQuestionCount: number
  sourceUrl: string
  questions: Question[]
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  bdquo: "\u201E",
  pound: "\u00A3",
  aacute: "\u00E1",
  eacute: "\u00E9",
  iacute: "\u00ED",
  oacute: "\u00F3",
  uacute: "\u00FA",
  aring: "\u00E5",
  frac12: "\u00BD",
  ordm: "\u00BA",
  middot: "\u00B7",
  times: "\u00D7",
}

function decodeEntities(value: string): string {
  return value
    .replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (match, code: string) => {
      if (code.startsWith("#")) {
        const numeric =
          code[1]?.toLowerCase() === "x"
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10)
        return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : match
      }
      return ENTITIES[code.toLowerCase()] ?? match
    })
    .replace(/\r\n/g, "\n")
}

function cleanHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      // Keep the part the task actually asks about marked as **bold**.
      .replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<[^>]+>/g, "")
  )
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-|-$/g, "")
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.text()
}

function parseExamTitle(raw: string): {
  title: string
  year: number
  kind: "nmt" | "zno"
  variant: string
} | null {
  const match = raw.match(
    /(НМТ|ЗНО)(?: онлайн)?\s+(\d{4})\s+року з англійської мови(?:\s*[–—-]\s*(.+))?/i
  )
  if (!match) return null

  const kind = match[1]?.toUpperCase() === "НМТ" ? "nmt" : "zno"
  const year = Number(match[2])
  const variant = cleanHtml(match[3] ?? "основна сесія")
  const label = kind === "nmt" ? "НМТ" : "ЗНО"
  return { title: `${label} ${year} · ${variant}`, year, kind, variant }
}

async function saveImage(src: string, testId: number): Promise<string | null> {
  const filename = `${testId}-${src.split("/").pop()}`
  const url = src.startsWith("http") ? src : `${SITE}${src}`

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    if (!response.ok) return null
    await writeFile(
      join(IMAGES_DIR, filename),
      new Uint8Array(await response.arrayBuffer())
    )
    return `/images/nmt/${filename}`
  } catch {
    return null
  }
}

async function main() {
  await mkdir(IMAGES_DIR, { recursive: true })
  await mkdir(DATA_DIR, { recursive: true })

  const index = await fetchText(`${SITE}/english/`)
  const testIds = [
    ...new Set(
      [
        ...index.matchAll(
          /href="(?:https:\/\/zno\.osvita\.ua)?\/english\/(\d+)\/?"/g
        ),
      ].map((match) => Number(match[1]))
    ),
  ].sort((a, b) => b - a)

  const exams: Exam[] = []

  for (const testId of testIds) {
    const url = `${SITE}/english/${testId}/`
    const page = await fetchText(url)
    const heading = page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
    const meta = parseExamTitle(cleanHtml(heading?.[1] ?? ""))
    if (!meta) {
      console.warn(`Skipping ${url}: unknown title`)
      continue
    }

    const cards = [
      ...page.matchAll(
        /<div class="task-card[^"]*"[^>]*id="q(\d+)"([\s\S]*?)(?=<div class="task-card|$)/g
      ),
    ]
    const questions: Question[] = []
    const imageCache = new Map<string, string | null>()

    for (const [, number, body] of cards) {
      const prompt = body.match(/<div class="question">([\s\S]*?)<\/div>/)?.[1]
      const answerKey = body.match(/name="result" value="([^"]+)"/)?.[1]
      if (!prompt || !answerKey) continue

      const options = [
        ...body.matchAll(
          /<div class="answer"><span class="marker">([A-H])<\/span>([\s\S]*?)<\/div>/g
        ),
      ]
        .map((match) => ({
          key: match[1] ?? "",
          text: cleanHtml(match[2] ?? ""),
        }))
        .filter((option) => option.key && option.text)

      const correct = answerKey
        .toUpperCase()
        .split(/[^A-H]/)
        .filter(Boolean)
      if (options.length < 2 || correct.length === 0) continue
      if (!correct.every((key) => options.some((option) => option.key === key)))
        continue

      const imageSrc = prompt.match(
        /src="(\/doc\/images\/znotest\/[^"]+)"/
      )?.[1]
      let imageUrl: string | undefined
      if (imageSrc) {
        if (!imageCache.has(imageSrc)) {
          imageCache.set(imageSrc, await saveImage(imageSrc, testId))
        }
        imageUrl = imageCache.get(imageSrc) ?? undefined
      }

      questions.push({
        id: `eng-${testId}-${number}`,
        type:
          correct.length > 1 || body.includes('type="checkbox"')
            ? "multi"
            : "single",
        question: cleanHtml(prompt),
        options,
        correct,
        ...(imageUrl ? { imageUrl } : {}),
      })
    }

    if (questions.length === 0) continue

    exams.push({
      id: `english-${meta.kind}-${meta.year}-${slugify(meta.variant)}-${testId}`,
      subject: "english",
      title: meta.title,
      year: meta.year,
      kind: meta.kind,
      variant: meta.variant,
      originalQuestionCount: Number(
        page.match(/Завдання 1 з (\d+)/)?.[1] ?? questions.length
      ),
      sourceUrl: url,
      questions,
    })
    console.log(`${meta.title}: ${questions.length} questions`)
  }

  exams.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "uk"))

  const lines = [
    "// Generated by apps/web/scripts/generate-nmt-english.ts — do not edit by hand.",
    'import type { NmtExam } from "@/lib/nmt"',
    "",
    "export const NMT_EXAMS: NmtExam[] = [",
  ]

  for (const exam of exams) {
    lines.push(
      "  {",
      `    id: ${JSON.stringify(exam.id)},`,
      `    subject: "english",`,
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
        ...(question.imageUrl
          ? [`        imageUrl: ${JSON.stringify(question.imageUrl)},`]
          : []),
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

  await writeFile(
    join(DATA_DIR, "nmt-english.ts"),
    `${lines.join("\n")}\n`,
    "utf8"
  )
  console.log(
    `english: ${exams.length} exams, ${exams.reduce((sum, exam) => sum + exam.questions.length, 0)} questions`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
