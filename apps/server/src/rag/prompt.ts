type Retrieved = {
  chunk: {
    id: string;
    docId: string;
    text: string;
  };
  score: number;
};

export function buildPrompt(input: { question: string; sources: Retrieved[] }) {
  const ctx = input.sources
    .map((s, i) => {
      const idx = i + 1;
      const snippet = s.chunk.text.replace(/\s+/g, " ").slice(0, 800);
      return [
        `[#${idx}] docId=${s.chunk.docId} chunkId=${s.chunk.id} score=${s.score.toFixed(4)}`,
        `内容：${snippet}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "你是一个严谨的RAG问答助手。只能基于【资料】回答；如果资料不足，请明确说明“资料不足，无法从给定资料得出结论”。",
    "",
    "【资料】",
    ctx || "（无）",
    "",
    "【问题】",
    input.question,
    "",
    "【回答要求】",
    "1) 结论先行，条理清晰。",
    "2) 必须引用资料编号[#]或chunkId作为依据（例如：引用[#2]）。",
    "3) 不要编造资料中不存在的事实。",
  ].join("\n");
}
