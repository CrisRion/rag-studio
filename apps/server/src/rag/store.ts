import crypto from "node:crypto";

export type DocStatus = "uploaded" | "processing" | "ready" | "failed";

export type DocumentItem = {
  id: string;
  name: string;
  status: DocStatus;
  createdAt: number;

  // 可解释性/可维护性增强字段（建议加）
  error?: string;

  // 索引参数记录（面试很加分）
  chunkSize?: number;
  overlap?: number;

  // 索引统计信息
  chunkCount?: number;
};

export type ChunkItem = {
  id: string;
  docId: string;
  text: string;
  vector: number[];
};

const docs = new Map<string, DocumentItem>();

// 用 Map 存 chunks，避免重复 push 导致无限增长
// key = chunkId
const chunks = new Map<string, ChunkItem>();

export function addDocument(input: {
  name: string;
  status: DocStatus;
  chunkSize?: number;
  overlap?: number;
}) {
  const id = crypto.randomUUID();

  docs.set(id, {
    id,
    name: input.name,
    status: input.status,
    createdAt: Date.now(),
    chunkSize: input.chunkSize,
    overlap: input.overlap,
    chunkCount: 0,
  });

  return id;
}

export function updateDocumentStatus(
  docId: string,
  status: DocStatus,
  patch?: {
    error?: string;
    chunkCount?: number;
  },
) {
  const d = docs.get(docId);
  if (!d) return;

  docs.set(docId, {
    ...d,
    status,
    // failed 才写 error；成功则清空 error
    error:
      status === "failed"
        ? (patch?.error ?? d.error ?? "unknown error")
        : undefined,
    chunkCount: patch?.chunkCount ?? d.chunkCount,
  });
}

export function listDocuments() {
  return Array.from(docs.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function upsertChunks(items: ChunkItem[]) {
  for (const item of items) {
    chunks.set(item.id, item);
  }
}

export function getAllChunks() {
  return Array.from(chunks.values());
}

export function getChunksByDocId(docId: string) {
  return Array.from(chunks.values()).filter((c) => c.docId === docId);
}
