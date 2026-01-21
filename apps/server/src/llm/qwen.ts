import OpenAI from "openai";

export const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-plus";

export function getQwenClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("Missing DASHSCOPE_API_KEY in env");

  return new OpenAI({
    apiKey,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });
}
