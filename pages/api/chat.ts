import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getEmbedding } from '../../lib/embedding'
import { retrieve } from '../../lib/rag'
import { SYSTEM_PROMPT } from '../../lib/systemPrompt'

let INDEX: { items: { id: string, url: string, text: string, embedding: number[] }[] } | null = null
function loadIndex() {
  if (!INDEX) {
    const p = path.join(process.cwd(), 'data', 'index.json')
    INDEX = JSON.parse(fs.readFileSync(p, 'utf8'))
  }
  return INDEX
}

async function callLLM(messages: any[]) {
  const apiKey = process.env.LLM_API_KEY!
  const url = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions'
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.2 })
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { messages, lang = 'en', emailOptIn, metadata } = req.body || {}
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages[] required' })

    const userText = messages[messages.length - 1]?.content || ''
    const index = loadIndex()

    const qEmbed = await getEmbedding(userText)
    const top = retrieve(qEmbed, index.items, 5)

    const context = top.map((t, i) => `[[doc${i+1}]] ${t.text}\n(Source: ${t.url})`).join('\n\n')

    const system = SYSTEM_PROMPT({ lang })
    const fullMessages = [
      { role: 'system', content: system },
      { role: 'user', content: userText },
      { role: 'system', content: `Use the nonprofit context below. If an answer isn't in context, say you don't know and offer to email the team.\n\nCONTEXT:\n${context}` }
    ]

    const answer = await callLLM(fullMessages)

    const lowConf = /\b(i (don't|do not) know|not sure|can't find)\b/i.test(answer)
    if (lowConf && process.env.HANDOFF_TO_EMAIL && emailOptIn?.email) {
      try {
        const nodemailer = (await import('nodemailer')).default
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        })
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.HANDOFF_TO_EMAIL,
          subject: 'ATDFK Chatbot Handoff',
          text: `From: ${emailOptIn.email}\nQuestion: ${userText}\nMetadata: ${JSON.stringify(metadata || {})}`
        })
      } catch (e) { console.error('Email handoff failed', e) }
    }

    res.status(200).json({ answer, citations: top.map(t => t.url) })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}