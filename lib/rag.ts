function dot(a: number[], b: number[]) { return a.reduce((s, v, i) => s + v*b[i], 0) }
function norm(a: number[]) { return Math.sqrt(a.reduce((s, v) => s + v*v, 0)) }
export function cosineSim(a: number[], b: number[]) { return dot(a,b) / (norm(a)*norm(b) + 1e-9) }

export function retrieve(q: number[], items: { id:string, url:string, text:string, embedding:number[] }[], k=5) {
  return items
    .map(it => ({ ...it, score: cosineSim(q, it.embedding) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, k)
}