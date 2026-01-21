import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 强制读取 apps/server/.env（不依赖你从哪里启动）
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import cors from "cors";
import documentsRouter from "./routes/documents.js";
import { chatRouter } from "./routes/chat.js";

const app = express();

// 允许前端跨域（开发阶段）
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/documents", documentsRouter);
app.use("/chat", chatRouter);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => console.log(`server http://localhost:${port}`));
