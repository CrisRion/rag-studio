export async function embedTexts(texts: string[]): Promise<number[][]> {
  return texts.map(fakeEmbedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  return fakeEmbedding(text);
}

function fakeEmbedding(text: string) {
  const dim = 128;
  const v = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    v[i % dim] += (text.charCodeAt(i) % 13) * 0.1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}
