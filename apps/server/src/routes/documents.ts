import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { splitToChunks } from "../rag/chunk.js";
import {
  addDocument,
  listDocuments,
  upsertChunks,
  updateDocumentStatus,
} from "../rag/store.js";
import { embedTexts } from "../rag/embed.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB（先够用）
});

router.get("/", (_req, res) => {
  res.json(listDocuments());
});

const UploadQuery = z.object({
  chunkSize: z.coerce.number().int().min(200).max(2000).default(800),
  overlap: z.coerce.number().int().min(0).max(400).default(120),
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const parsed = UploadQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { chunkSize, overlap } = parsed.data;

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const originalName = req.file.originalname;
  const filePath = req.file.path;

  // 仅允许 txt / md（先别搞 PDF，减少坑）
  const ext = path.extname(originalName).toLowerCase();
  if (![".txt", ".md"].includes(ext)) {
    return res
      .status(400)
      .json({ error: "Only .txt and .md are supported for now" });
  }

  const docId = addDocument({
    name: originalName,
    status: "processing",
    chunkSize,
    overlap,
  });

  try {
    const raw = fs.readFileSync(filePath, "utf-8");

    const chunkTexts = splitToChunks(raw, { chunkSize, overlap });
    const vectors = await embedTexts(chunkTexts);

    const items = chunkTexts.map((text, idx) => ({
      id: `${docId}-${idx}`,
      docId,
      text,
      vector: vectors[idx],
    }));

    upsertChunks(items);
    updateDocumentStatus(docId, "ready", { chunkCount: items.length });

    res.json({
      id: docId,
      name: originalName,
      status: "ready",
      chunks: items.length,
    });
  } catch (e: any) {
    updateDocumentStatus(docId, "failed", {
      error: e?.message ?? "upload processing failed",
    });
    res.status(500).json({ error: e?.message ?? "upload processing failed" });
  }
});

export default router;
