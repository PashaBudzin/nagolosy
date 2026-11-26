#!/usr/bin/env bun

import { mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"

const CATEGORIES = [
  { id: "76772", name: "Громадсько-політичні та військові діячі" },
  { id: "60512", name: "Діячі культури, освіти та науки" },
  { id: "59830", name: "Архітектура культових споруд в Україні" },
  { id: "60187", name: "Архітектура фортифікаційних споруд в Україні" },
  { id: "60191", name: "Світська архітектура. Містобудування" },
  { id: "60192", name: "Скульптура. Пам'ятники" },
  { id: "60193", name: "Ікони (Образотворче мистецтво)" },
  { id: "60196", name: "Мініатюри. Гравюри. Портрети" },
  { id: "60195", name: "Художні роботи (Образотворче мистецтво)" },
  { id: "60197", name: "Пам'ятки стародавньої історії України" },
]

interface ScrapedItem {
  category: string
  categoryIndex: number
  name: string
  imageUrl: string
  localFilename: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&laquo;/g, "\u00AB")
    .replace(/&raquo;/g, "\u00BB")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-яіїєґ]+/gu, (match) => {
      const map: Record<string, string> = {
        а: "a",
        б: "b",
        в: "v",
        г: "h",
        ґ: "g",
        д: "d",
        е: "e",
        є: "ie",
        ж: "zh",
        з: "z",
        и: "y",
        і: "i",
        ї: "yi",
        й: "i",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "kh",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "shch",
        ь: "",
        ю: "iu",
        я: "ia",
      }
      return match
        .split("")
        .map((ch) => map[ch] || ch)
        .join("")
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

function extractItems(
  html: string,
  categoryName: string,
  categoryIndex: number
): ScrapedItem[] {
  const items: ScrapedItem[] = []
  const seenImages = new Set<string>()

  // Pattern 1: Bold items <b>1. Name.</b> followed by <img>
  const boldPattern =
    /<b>\d+\.\s*(.+?)\.<\/b>[\s\S]*?<img[^>]+src="([^"]+)"/g

  let match
  while ((match = boldPattern.exec(html)) !== null) {
    const name = stripHtml(match[1]).trim()
    const imageUrl = match[2]

    if (isIgnorableImage(imageUrl) || seenImages.has(imageUrl)) continue
    seenImages.add(imageUrl)

    const slug = slugify(name)
    const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || "jpg"
    const localFilename = `${categoryIndex + 1}-${slug}.${ext}`

    items.push({
      category: categoryName,
      categoryIndex,
      name,
      imageUrl,
      localFilename,
    })
  }

  // Pattern 2: Strong-linked items <strong>27. <a href="...">Name</a></strong> followed by <img>
  const strongLinkedPattern =
    /<strong>\d+\.\s*<a[^>]+>([^<]+)<\/a><\/strong>[\s\S]*?<img[^>]+src="([^"]+)"/g

  while ((match = strongLinkedPattern.exec(html)) !== null) {
    const name = stripHtml(match[1]).trim()
    const imageUrl = match[2]

    if (isIgnorableImage(imageUrl) || seenImages.has(imageUrl)) continue
    seenImages.add(imageUrl)

    const slug = slugify(name)
    const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || "jpg"
    const localFilename = `${categoryIndex + 1}-${slug}.${ext}`

    items.push({
      category: categoryName,
      categoryIndex,
      name,
      imageUrl,
      localFilename,
    })
  }

  // Pattern 3: Plain linked items 1. <a href="...">Name</a>. followed by <img> (architecture pages)
  const linkedPattern =
    /(?:^|\n)\s*\d+\.\s*<a[^>]+>([^<]+)<\/a>[^<]*[\s\S]*?<img[^>]+src="([^"]+)"/g

  while ((match = linkedPattern.exec(html)) !== null) {
    const name = stripHtml(match[1]).trim()
    const imageUrl = match[2]

    if (isIgnorableImage(imageUrl) || seenImages.has(imageUrl)) continue
    seenImages.add(imageUrl)

    const slug = slugify(name)
    const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || "jpg"
    const localFilename = `${categoryIndex + 1}-${slug}.${ext}`

    items.push({
      category: categoryName,
      categoryIndex,
      name,
      imageUrl,
      localFilename,
    })
  }

  return items
}

function isIgnorableImage(url: string): boolean {
  return (
    url.includes("logo") ||
    url.includes("icon") ||
    url.includes("favicon") ||
    url.includes("avatar")
  )
}

async function downloadImage(
  url: string,
  destPath: string
): Promise<boolean> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`  Failed to download ${url}: ${res.status}`)
      return false
    }
    const buffer = await res.arrayBuffer()
    await writeFile(destPath, Buffer.from(buffer))
    return true
  } catch (err) {
    console.error(`  Error downloading ${url}:`, err)
    return false
  }
}

function generateDataFile(allItems: ScrapedItem[]): string {
  const lines: string[] = [
    `export interface VisualHistoryItem {`,
    `  id: string`,
    `  category: string`,
    `  imageUrl: string`,
    `  name: string`,
    `}`,
    ``,
    `export const VISUAL_HISTORY_ITEMS: VisualHistoryItem[] = [`,
  ]

  for (const item of allItems) {
    const id = item.localFilename.replace(/\.[^.]+$/, "")
    lines.push(
      `  { id: "${id}", category: "${item.category}", imageUrl: "/images/visual-history/${item.localFilename}", name: "${item.name.replace(/"/g, '\\"')}" },`
    )
  }

  lines.push(`]`)
  return lines.join("\n")
}

function generateGroupsFile(allItems: ScrapedItem[]): string {
  const lines: string[] = [
    `export interface VisualHistoryGroup {`,
    `  id: string`,
    `  name: string`,
    `  itemIndices: number[]`,
    `}`,
    ``,
    `export const VISUAL_HISTORY_GROUPS: VisualHistoryGroup[] = [`,
  ]

  for (const [catIndex, cat] of CATEGORIES.entries()) {
    const indices = allItems
      .map((item, i) => (item.categoryIndex === catIndex ? i : -1))
      .filter((i) => i !== -1)
    const groupId = slugify(cat.name)
    lines.push(
      `  { id: "${groupId}", name: "${cat.name}", itemIndices: [${indices.join(", ")}] },`
    )
  }

  lines.push(`]`)
  return lines.join("\n")
}

async function main() {
  const imagesDir = join(import.meta.dir, "..", "public", "images", "visual-history")

  if (!existsSync(imagesDir)) {
    await mkdir(imagesDir, { recursive: true })
  }

  const allItems: ScrapedItem[] = []

  for (const [catIndex, cat] of CATEGORIES.entries()) {
    console.log(`\n📂 Fetching category ${catIndex + 1}/10: ${cat.name}`)
    const url = `https://osvita.ua/test/training/history/${cat.id}/`

    try {
      const html = await fetchPage(url)
      const items = extractItems(html, cat.name, catIndex)
      console.log(`  Found ${items.length} items`)
      allItems.push(...items)
    } catch (err) {
      console.error(`  Error fetching category:`, err)
    }
  }

  console.log(`\n📊 Total items found: ${allItems.length}`)

  // Download images
  console.log(`\n🖼️  Downloading images...`)
  let downloaded = 0
  let failed = 0

  for (const item of allItems) {
    const destPath = join(imagesDir, item.localFilename)
    if (existsSync(destPath)) {
      downloaded++
      continue
    }

    const ok = await downloadImage(item.imageUrl, destPath)
    if (ok) downloaded++
    else failed++

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log(`\n✅ Downloaded: ${downloaded}, Failed: ${failed}`)

  // Generate data files
  console.log(`\n📝 Generating data files...`)

  const dataPath = join(import.meta.dir, "..", "src", "data", "visual-history.ts")
  await writeFile(dataPath, generateDataFile(allItems))
  console.log(`  Created ${dataPath}`)

  const groupsPath = join(import.meta.dir, "..", "src", "data", "visual-history-groups.ts")
  await writeFile(groupsPath, generateGroupsFile(allItems))
  console.log(`  Created ${groupsPath}`)

  console.log(`\n🎉 Done!`)
}

main()
