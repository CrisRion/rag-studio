import { getAllChunks } from "./store.js";
import { embedQuery } from "./embed.js";

function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export async function retrieveTopK(query: string, k: number) {
  const qv = await embedQuery(query);
  const all = getAllChunks();
  console.log("[retrieve] chunks:", all.length);

  const scored = all.map((chunk) => ({
    chunk,
    score: cosine(qv, chunk.vector),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
