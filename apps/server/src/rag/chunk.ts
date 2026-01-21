export function splitToChunks(
  text: string,
  opts: { chunkSize: number; overlap: number },
) {
  const { chunkSize, overlap } = opts;
  const clean = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];

  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}
