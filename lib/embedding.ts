export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.LLM_API_KEY!
  const url = process.env.EMBED_API_URL || 'https://api.openai.com/v1/embeddings'
  const model = process.env.EMBED_MODEL || 'text-embedding-3-small'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input: text })
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return json.data[0].embedding
}