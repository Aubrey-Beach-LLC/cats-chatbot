import fs from 'fs'
import path from 'path'
import { getEmbedding } from '../lib/embedding'

const SOURCES: { url: string, selector?: string }[] = [
  { url: 'https://atdevicesforkids.org/', selector: 'main' },
  { url: 'https://atdevicesforkids.org/about/faqs/', selector: 'main' },
  { url: 'https://atdevicesforkids.org/eligibility/', selector: 'main' },
  { url: 'https://atdevicesforkids.org/apply/', selector: 'main' },
  { url: 'https://atdevicesforkids.org/donate/', selector: 'main' },
  { url: 'https://atdevicesforkids.org/contact/', selector: 'main' }
]

async function fetchTextFromURL(url: string, selector?: string) {
  const html = await (await fetch(url)).text()
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text
}

async function fetchNavLinks(home = 'https://atdevicesforkids.org/') {
  const html = await (await fetch(home)).text()
  const anchors = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi))
  const links = anchors
    .map(m => m[1])
    .filter(href => href.startsWith('https://atdevicesforkids.org/') && !href.includes('#'))
  return Array.from(new Set(links))
}

function chunk(text: string, size = 1100, overlap = 150) {
  const chunks: string[] = []
  for (let i=0; i<text.length; i += (size - overlap)) {
    chunks.push(text.slice(i, i+size))
  }
  return chunks
}

export async function getEmbeddingMany(texts: { id: string, url: string, text: string }[]) {
  const out: { id: string, url: string, text: string, embedding: number[] }[] = []
  for (const t of texts) {
    const embedding = await getEmbedding(t.text)
    out.push({ ...t, embedding })
  }
  return out
}

async function run() {
  const docs: { id: string, url: string, text: string }[] = []
  const navLinks = await fetchNavLinks('https://atdevicesforkids.org/')
  const all = Array.from(new Set([...SOURCES.map(s => s.url), ...navLinks]))

  for (const url of all) {
    const txt = await fetchTextFromURL(url)
    const parts = chunk(txt)
    parts.forEach((p, i) => docs.push({ id: `${url}#${i}`, url, text: p }))
  }

  const embedded = await getEmbeddingMany(docs)
  const outPath = path.join(process.cwd(), 'data', 'index.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify({ items: embedded }, null, 2))
  console.log('Wrote', outPath, 'with', embedded.length, 'chunks from', all.length, 'pages')
}

run().catch(e => { console.error(e); process.exit(1) })