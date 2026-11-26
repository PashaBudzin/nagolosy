import { Fragment, useMemo, type ReactNode } from "react"
import katex from "katex"

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
}

function decodeEntities(value: string): string {
  return value.replace(
    /&(#x?[0-9a-f]+|[a-z0-9]+);/gi,
    (match, code: string) => {
      if (code.startsWith("#")) {
        const numeric =
          code[1]?.toLowerCase() === "x"
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10)
        return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : match
      }
      return ENTITIES[code.toLowerCase()] ?? match
    }
  )
}

/** Characters that can appear in a formula (Cyrillic is never one of them). */
const MATH_CHARACTERS = new Set(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" +
    "()+−-=*/.,;:^_{}[]<>|√π≤≥⋅°%\\"
)

/** A run of math characters is only a formula if it has real math syntax. */
const MATH_INDICATOR = /[_^=/{}√⋅≤≥−\\]|\b(?:log|sin|cos|tan|ctg)\d+\(/

type Segment = { type: "math" | "text"; value: string }

export function segmentLine(line: string): Segment[] {
  const segments: Segment[] = []
  let buffer = ""
  let mode: "math" | "text" | null = null

  const flush = () => {
    if (!buffer) return
    if (mode === "math" && MATH_INDICATOR.test(buffer)) {
      const leading = /^\s*/.exec(buffer)?.[0] ?? ""
      const trailing = /\s*$/.exec(buffer)?.[0] ?? ""
      const core = buffer.trim()
      if (leading) segments.push({ type: "text", value: leading })
      if (core) segments.push({ type: "math", value: core })
      if (trailing) segments.push({ type: "text", value: trailing })
    } else {
      segments.push({ type: "text", value: buffer })
    }
    buffer = ""
    mode = null
  }

  for (let index = 0; index < line.length; index++) {
    const character = line[index]!

    // Fill-in-the-blank runs are plain text, never LaTeX subscripts.
    if (character === "_" && line[index + 1] === "_") {
      if (mode === "math") flush()
      let end = index
      while (line[end] === "_") end++
      segments.push({ type: "text", value: line.slice(index, end) })
      index = end - 1
      mode = "text"
      buffer = ""
      continue
    }

    const isMath =
      MATH_CHARACTERS.has(character) || (character === " " && mode === "math")

    if (isMath) {
      if (mode === "text") flush()
      mode = "math"
    } else {
      if (mode === "math") flush()
      mode = "text"
    }
    buffer += character
  }
  flush()

  return segments
}

/** Normalizes plain-text math notation into something KaTeX understands. */
export function renderMath(value: string): string {
  const tex = value
    .replace(/−/g, "-")
    .replace(/·/g, "\\cdot ")
    .replace(/×/g, "\\times ")
    .replace(/∘/g, "\\circ ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/√\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√([A-Za-z0-9]+)/g, "\\sqrt{$1}")
    .replace(/\blog(\d+)/g, "\\log_$1")
    .replace(/\b(sin|cos|tan|ctg|tg)\b/g, "\\$1 ")

  return katex.renderToString(tex, { displayMode: false, throwOnError: true })
}

interface FormattedTextProps {
  text: string
  className?: string
}

/** Renders exam text: formulas, **bold** markers, entities and line breaks. */
export function FormattedText({ text, className }: FormattedTextProps) {
  const content = useMemo<ReactNode>(() => {
    return decodeEntities(text)
      .split("\n")
      .map((line, lineIndex) => {
        const parts = line.split("**").map((part, partIndex) => {
          const nodes = segmentLine(part).map((segment, segmentIndex) => {
            if (segment.type !== "math") {
              return <Fragment key={segmentIndex}>{segment.value}</Fragment>
            }
            try {
              return (
                <span
                  key={segmentIndex}
                  dangerouslySetInnerHTML={{
                    __html: renderMath(segment.value),
                  }}
                />
              )
            } catch {
              return <Fragment key={segmentIndex}>{segment.value}</Fragment>
            }
          })

          return partIndex % 2 === 1 ? (
            <strong key={partIndex}>{nodes}</strong>
          ) : (
            <Fragment key={partIndex}>{nodes}</Fragment>
          )
        })

        return (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {parts}
          </Fragment>
        )
      })
  }, [text])

  return <span className={className}>{content}</span>
}
