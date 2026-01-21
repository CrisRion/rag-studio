export type Source = {
  docId: string;
  chunkId: string;
  score: number;
  snippet: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export type DocumentItem = {
  id: string;
  name: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  createdAt: number;
};
