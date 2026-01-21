type DocStatus = "uploaded" | "processing" | "ready" | "failed";

export type DocumentItem = {
  id: string;
  name: string;
  status: DocStatus;
  createdAt: number;
};

export type ChunkItem = {
  id: string;
  docId: string;
  text: string;
  vector: number[];
};

const docs = new Map<string, DocumentItem>();
const chunks: ChunkItem[] = [];

export function addDocument(input: { name: string; status: DocStatus }) {
  const id = crypto.randomUUID();
  docs.set(id, {
    id,
    name: input.name,
    status: input.status,
    createdAt: Date.now(),
  });
  return id;
}

export function updateDocumentStatus(docId: string, status: DocStatus) {
  const d = docs.get(docId);
  if (!d) return;
  docs.set(docId, { ...d, status });
}

export function listDocuments() {
  return Array.from(docs.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function upsertChunks(items: ChunkItem[]) {
  chunks.push(...items);
}

export function getAllChunks() {
  return chunks;
}
