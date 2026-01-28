import { Router } from "express";
import { getQwenClient, QWEN_MODEL } from "../llm/qwen.js";
import { retrieveTopK } from "../rag/retrieve.js";
import { buildPrompt } from "../rag/prompt.js";

export const chatRouter = Router();

/**
 * GET /chat/stream?question=xxx&topK=4
 * SSE events:
 *  - token: { token }
 *  - done: { sources }
 */
chatRouter.get("/stream", async (req, res) => {
  const question = String(req.query.question || "").trim();
  const topK = Number(req.query.topK || 4);

  if (!question) {
    return res.status(400).json({ message: "question is required" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    // 1) retrieve
    const sources = await retrieveTopK(question, topK);

    //无检索结果直接返回（不进 LLM）
    if (!sources || sources.length === 0) {
      res.write(`event: done\n`);
      res.write(
        `data: ${JSON.stringify({
          answer:
            "在当前知识库中没有检索到相关内容，我无法依据文档回答。你可以尝试换关键词或先上传相关文档。",
          sources: [],
        })}\n\n`,
      );
      return res.end();
    }

    const finalSources = sources.map((s) => ({
      docId: s.chunk.docId,
      chunkId: s.chunk.id,
      score: Number(s.score.toFixed(4)),
      snippet: s.chunk.text.slice(0, 180),
    }));

    // 2) prompt
    const prompt = buildPrompt({
      question,
      sources,
    });

    // 3) qwen stream
    const qwen = getQwenClient();
    const stream = await qwen.chat.completions.create({
      model: QWEN_MODEL,
      stream: true,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是一个严谨的RAG问答助手。只能基于给定资料回答，必要时说明无法从资料得出结论。",
        },
        { role: "user", content: prompt },
      ],
    });

    for await (const part of stream) {
      const token = part.choices?.[0]?.delta?.content ?? "";
      if (token) {
        res.write(`event: token\n`);
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    res.write(`event: done\n`);
    res.write(`data: ${JSON.stringify({ sources: finalSources })}\n\n`);
    res.end();
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "stream error";

    res.write(`event: error\n`);
    res.write(
      `data: ${JSON.stringify({
        code: "STREAM_FAILED",
        message,
      })}\n\n`,
    );
    res.end();
  }
});
