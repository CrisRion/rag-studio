# RAG Studio（RAG 知识库问答工作台）

一个面向个人/团队文档检索的知识库问答工作台，支持文档上传解析、向量检索、引用溯源与流式对话（SSE）。

如果你对 RAG 并不了解，可以参考这篇文章：[What Is RAG in AI and How to Use It? [LLM + RAG Tutorial]](https://www.v7labs.com/blog/what-is-rag)

**Tech Stack**：React / TypeScript / Node.js / LangChain / SSE / Vector Store

---

## Features

- 文档上传与入库（开发中）
- 文档解析与 Chunk 切分（overlap）（开发中）
- RAG 主链路：Embedding 向量化 + TopK 检索召回 + Prompt 组装（开发中）
- SSE 流式输出：前端逐字渲染（开发中）
- 引用溯源：回答返回 sources（命中文档片段）（开发中）
- 异常兜底：上传失败、解析失败、无检索结果、超时等（开发中）

---

## Project Structure

本项目采用 **pnpm monorepo** 组织代码：

```bash
rag-studio/
  apps/
    web/        # 前端：React + Vite
    server/     # 后端：Node.js（RAG API / SSE / 文档处理）
  packages/     # 共享包（预留/可扩展）
```

---

## Requirements

- Node.js >= 18（推荐 20+）
- pnpm >= 9

---

## Quick Start

### 1) Install

在项目根目录执行：

```bash
pnpm install
```

---

### 2) Run (Web + Server)

在项目根目录执行：

```bash
pnpm dev
```

启动成功后：

- Web（Vite）：[http://localhost:5173/](http://localhost:5173/)
- Server：[http://localhost:8787/](http://localhost:8787/)

---

## Scripts

根目录常用脚本：

```bash
# 同时启动 web + server
pnpm dev

# 单独启动 web
pnpm dev:web

# 单独启动 server
pnpm dev:server

# 构建全部 workspace
pnpm build

# lint 全部 workspace
pnpm lint
```

---

## Environment Variables

后端使用 `.env` 注入环境变量（位于 `apps/server/.env`）。

---

## Roadmap（10 Days Sprint）

- [ ] 文档上传与解析流水线（processing → ready）
- [ ] Chunk 切分与向量入库
- [ ] RAG 主链路（TopK 检索 + Prompt 组装）
- [ ] SSE 流式输出 + Stop/Retry
- [ ] 引用溯源 sources 展示
- [ ] 异常兜底与稳定性优化
- [ ] README 完整化（架构图 / API / 演示截图）
