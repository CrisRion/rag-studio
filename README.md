# RAG Studio（RAG 知识库问答工作台）

面向个人/团队文档检索的知识库问答工作台：支持文档上传解析、Chunk 切分与向量索引、TopK 检索召回、SSE 流式对话与引用溯源（sources）。

如果你对 RAG 并不了解，可以参考这篇文章：[What Is RAG in AI and How to Use It? [LLM + RAG Tutorial]](https://www.v7labs.com/blog/what-is-rag)

- Web：React + TypeScript + Zustand + Tailwind
- Server：Node.js + Express + SSE
- RAG：Chunk → Embed → Store → RetrieveTopK → Prompt → LLM(stream)
- 当前支持：`.txt` / `.md`

---

## Demo 截图

- Documents 列表（upload / status / params / chunkCount / error）
- Chat 流式输出（SSE）
- Sources 展开（rank / docName / score / chunkId / snippet）

```text
docs/images/documents.png
docs/images/chat_stream.png
docs/images/sources.png
```

---

## 架构图

```
flowchart LR
  subgraph Web[apps/web]
    UI[Chat UI / Documents UI]
    Store[Zustand stores]
  end

  subgraph Server[apps/server]
    API[Express Routes]
    RAG[RAG Pipeline]
    SSE[SSE Stream Endpoint]
  end

  subgraph RAGCore[RAG Core]
    Chunk[Chunking]
    Embed[Embedding]
    StoreMem[In-memory Vector Store]
    Retrieve[RetrieveTopK (cosine)]
    Prompt[Prompt Builder]
    LLM[LLM Client (stream)]
  end

  UI -->|HTTP| API
  UI -->|EventSource| SSE

  API --> RAG
  SSE --> RAG

  RAG --> Chunk --> Embed --> StoreMem
  RAG --> Retrieve --> Prompt --> LLM
  StoreMem --> Retrieve
  LLM --> SSE
```

---

## 核心流程

### 1) 文档入库流程（Indexing）

```
flowchart TD
  A[Upload .txt/.md] --> B[Save file]
  B --> C[Split to chunks (chunkSize/overlap)]
  C --> D[Embed chunks]
  D --> E[Upsert to Vector Store]
  E --> F[Update doc status ready / failed]

```

### 2) 问答流程（RAG + SSE）

```
flowchart TD
  Q[User Question] --> EQ[Embed Query]
  EQ --> R[Retrieve TopK chunks]
  R -->|no hits| NH[Hard fallback: no context reply]
  R --> P[Build Prompt (must rely on context)]
  P --> L[LLM Stream]
  L --> S[SSE: token events]
  L --> D[SSE: done (answer + sources)]
```

---

## 功能清单

- 文档上传与解析：入库、Chunk 切分（overlap）、索引状态管理（processing/ready/failed）
- RAG 主链路：Embedding 向量化 + TopK 检索召回 + Prompt 组装（强约束：仅基于 context）
- SSE 流式输出：逐 token 推送 + Stop（前端可中止）
- 引用溯源：返回 sources（docId/snippet/score/chunkId），前端可展开查看、支持定位高亮
- 错误兜底硬化：
  - retrieve 为空：服务端硬短路直接返回“无检索结果”
  - stream/LLM/embedding 出错：统一错误结构（code/message），前端可读提示
- Query cache（Map + TTL 30s）：相同 question+topK 秒回（可选 meta 标记 cached）

---

## 本地运行

### 依赖要求

- Node.js >= 18（建议 20+）
- pnpm >= 9

### 安装与启动

```bash
pnpm install
pnpm dev
```

默认地址：

- Web: [http://localhost:5173](http://localhost:5173)
- Server: [http://localhost:8787](http://localhost:8787)

---

## API 列表

> 以当前实现为准（路径可能随版本微调）。

### Health

- `GET /health`
  - 返回：`{ ok: true }`

### Documents

- `GET /documents`
  - 返回：文档列表（包含 status/createdAt/参数/错误等）

- `POST /documents/upload`
  - form-data：`file`
  - query：`chunkSize`（可选），`overlap`（可选）
  - 返回：文档 id、状态、chunkCount 等

### Chat（SSE）

- `GET /chat/stream?question=...&topK=4`
  - SSE events：
    - `event: token` → `{ token }`
    - `event: done` → `{ answer, sources }`
    - `event: error` → `{ code, message }`
    - （可选）`event: meta` → `{ cached: true }`

---

## 数据结构（前后端字段约定）

### Source

```ts
type Source = {
  docId: string;
  chunkId: string;
  score: number;
  snippet: string;
};
```

### Done Payload（SSE done）

```ts
type DonePayload = {
  answer: string;
  sources: Source[];
};
```

---

## 使用说明

1. 打开 Documents 页面，上传 `.txt` / `.md`
2. 等待文档状态变为 `ready`
3. 切到 Chat 页面提问（与文档内容相关的问题效果最佳）
4. 展开 sources 查看引用依据（rank / docName / score / snippet）
5. 需要中止生成时点击 Stop

---

## 技术亮点

- **真 SSE（EventSource）**：服务端 token 级推送，前端逐字增长，Stop 可立即中止
- **可解释性**：TopK 检索结果以 sources 结构回传（docId/snippet/score/chunkId），UI 支持定位高亮
- **不胡编硬约束**：retrieve 为空服务端直接短路返回“无检索结果”，保证回答始终“查有所依”
- **工作台化设计**：索引状态机 + 参数可追溯（chunkSize/overlap）+ chunkCount + 错误可读提示
- **性能优化**：query cache（TTL 30s）降低重复查询延迟

---

## Trade-offs（取舍与后续扩展）

- 当前 Vector Store 为内存实现：重启会丢失索引
  → 可替换为 Chroma / Qdrant / PGVector 等持久化方案
- 当前仅支持 `.txt/.md`
  → 可扩展 PDF：解析（pdf.js / pdf-parse）→ 清洗 → chunk → embed
- 缓存为进程内 Map
  → 可替换为 Redis，支持多实例与更长 TTL

---

## 项目结构

```text
apps/
  web/        # React + TS 前端
  server/     # Express + SSE 后端
packages/     # 预留扩展
```

```

```
