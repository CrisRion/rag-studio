import { useEffect, useMemo, useState, useRef } from "react";
import { useDocStore } from "./stores/docStore";
import { useChatStore } from "./stores/chatStore";
import { useSettingsStore } from "./stores/settingsStore";
import type { DocumentItem } from "./stores/docStore";

type SourceItem = {
  docId: string;
  chunkId: string;
  score: number;
  snippet: string;
};

function DocumentsView() {
  const { documents, loading, uploading, error, refresh, upload } =
    useDocStore();

  // 用 ref 防止重复开定时器 / 组件卸载后继续跑
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const badgeClass = (status: string) => {
    const base = "rounded-lg border px-2 py-1 text-xs inline-flex items-center";
    if (status === "ready")
      return `${base} border-green-200 bg-green-50 text-green-700`;
    if (status === "processing")
      return `${base} border-yellow-200 bg-yellow-50 text-yellow-700`;
    if (status === "failed")
      return `${base} border-red-200 bg-red-50 text-red-700`;
    return `${base} border-gray-200 bg-gray-50 text-gray-700`;
  };

  const formatTime = (ts: number) => {
    const d = new Date(Number(ts));
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const formatParams = (d: DocumentItem) => {
    const cs = typeof d.chunkSize === "number" ? d.chunkSize : undefined;
    const ov = typeof d.overlap === "number" ? d.overlap : undefined;
    if (cs == null || ov == null) return "-";
    return `${cs}/${ov}`;
  };

  const hasProcessing = useMemo(
    () => documents.some((d) => d.status === "processing"),
    [documents],
  );

  // 自动轮询：有 processing 就每 2 秒 refresh；没有就停止
  useEffect(() => {
    // 如果有 processing 且当前没有 timer，就启动轮询
    if (hasProcessing && timerRef.current == null) {
      timerRef.current = window.setInterval(() => {
        // 避免在手动 loading 时频繁叠加请求（可选）
        refresh();
      }, 2000);
    }

    // 如果没有 processing 且 timer 存在，就停止轮询
    if (!hasProcessing && timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      // 组件卸载时清理
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasProcessing, refresh]);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Documents</div>
          <div className="mt-1 text-sm text-gray-600">
            上传 .txt / .md 进行索引（参数可追溯：chunkSize/overlap）
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => refresh()}
            disabled={loading}
            type="button"
            title="手动刷新列表"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <label className="cursor-pointer rounded-xl bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">
            {uploading ? "Uploading..." : "Upload"}
            <input
              className="hidden"
              type="file"
              accept=".txt,.md"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {(error || uploading) && (
        <div className="mt-4 space-y-2">
          {uploading && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              Uploading...
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 text-sm font-medium text-gray-700">列表</div>

        <div className="rounded-xl border">
          <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Params</div>
            <div className="col-span-1">Chunks</div>
            <div className="col-span-2 text-right">Created</div>
            <div className="col-span-1">Error</div>
          </div>

          {loading && documents.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-600">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-600">
              暂无文档，请先上传。
            </div>
          ) : (
            documents.map((d: DocumentItem) => (
              <div
                key={d.id}
                className="grid grid-cols-12 items-center px-4 py-3 text-sm border-b last:border-b-0"
              >
                <div className="col-span-4 truncate font-medium">{d.name}</div>

                <div className="col-span-2">
                  <span className={badgeClass(d.status)}>{d.status}</span>
                </div>

                <div className="col-span-2 text-xs text-gray-700">
                  {formatParams(d)}
                </div>

                <div className="col-span-1 text-gray-700">
                  {d.status === "ready" ? (d.chunkCount ?? "-") : "-"}
                </div>

                <div className="col-span-2 text-right text-xs text-gray-600">
                  {formatTime(d.createdAt)}
                </div>

                <div className="col-span-1 text-xs">
                  {d.status === "failed" && d.error ? (
                    <span className="text-red-700" title={d.error}>
                      {String(d.error).length > 12
                        ? String(d.error).slice(0, 12) + "..."
                        : String(d.error)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {hasProcessing && (
          <div className="mt-3 text-xs text-gray-500">
            检测到 processing 文档，已开启自动刷新（每 2 秒一次）。
          </div>
        )}
      </div>
    </div>
  );
}

function SourcesCard({ sources }: { sources: SourceItem[] }) {
  const [open, setOpen] = useState(false);

  // 当前高亮的 source（chunkId）
  const [activeId, setActiveId] = useState<string | null>(null);

  // 每条 source 的 DOM 引用，用于 scrollIntoView
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { documents } = useDocStore();

  const docNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of documents) m.set(d.id, d.name);
    return m;
  }, [documents]);

  const scoreText = (s: number) =>
    typeof s === "number" ? s.toFixed(4) : String(s);
  const docNameOf = (docId: string) => docNameMap.get(docId) ?? docId;

  // 高亮自动消失（1.5s）
  useEffect(() => {
    if (!activeId) return;
    const t = window.setTimeout(() => setActiveId(null), 1500);
    return () => window.clearTimeout(t);
  }, [activeId]);

  const locate = (chunkId: string) => {
    // 如果还没展开，先展开再定位
    if (!open) setOpen(true);

    // 下一帧再滚动，确保 DOM 已经渲染
    requestAnimationFrame(() => {
      const el = itemRefs.current[chunkId];
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setActiveId(chunkId);
    });
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <button
          className="text-xs text-gray-600 hover:text-gray-900"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          {open ? "Hide sources" : `Show sources (${sources.length})`}
        </button>

        {sources.length > 0 && (
          <button
            className="text-xs text-gray-600 hover:text-gray-900"
            onClick={() => locate(sources[0].chunkId)}
            type="button"
            title="快速定位到 Top1 source"
          >
            Locate Top1
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((s, idx) => {
            const isActive = activeId === s.chunkId;

            return (
              <div
                key={s.chunkId}
                ref={(node) => {
                  itemRefs.current[s.chunkId] = node;
                }}
                className={[
                  "rounded-xl border bg-gray-50 p-3 transition",
                  // 高亮效果：边框 + ring + 背景稍亮
                  isActive
                    ? "ring-2 ring-gray-900 border-gray-900 bg-white"
                    : "",
                ].join(" ")}
              >
                {/* 点击这行也可以定位/高亮 */}
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => locate(s.chunkId)}
                  title="点击定位并高亮"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="rounded-md border bg-white px-2 py-0.5 font-medium text-gray-800">
                      #{idx + 1}
                    </span>

                    <span
                      className="rounded-md border bg-white px-2 py-0.5"
                      title={`docId: ${s.docId}`}
                    >
                      {docNameOf(s.docId)}
                    </span>

                    <span className="rounded-md border bg-white px-2 py-0.5">
                      chunk: {s.chunkId}
                    </span>

                    <span className="rounded-md border bg-white px-2 py-0.5">
                      score: {scoreText(s.score)}
                    </span>

                    <span className="text-gray-400 ml-auto">
                      click to locate
                    </span>
                  </div>

                  <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {s.snippet}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatView() {
  const { messages, isGenerating, error, stop, send, clear } = useChatStore();
  const { topK, setTopK } = useSettingsStore();
  const [input, setInput] = useState("");

  const canSend = useMemo(
    () => input.trim().length > 0 && !isGenerating,
    [input, isGenerating],
  );

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Chat</div>
          <div className="mt-1 text-sm text-gray-600">
            SSE 流式输出 + 引用溯源
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">topK</span>
            <input
              className="w-16 rounded-lg border px-2 py-1 text-sm"
              type="number"
              min={1}
              max={10}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
            />
          </div>

          <button
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={clear}
          >
            Clear
          </button>

          {isGenerating && (
            <button
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
              onClick={() => stop?.()}
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 h-105 overflow-auto rounded-xl border p-4">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-600">
            暂无消息。先去 Documents 上传文档，再回来提问。
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={[
                    "inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm",
                    m.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900",
                  ].join(" ")}
                >
                  {m.content ||
                    (m.role === "assistant" && isGenerating ? "..." : "")}
                </div>

                {m.role === "assistant" &&
                  m.sources &&
                  m.sources.length > 0 && (
                    <div className="mt-1">
                      <SourcesCard sources={m.sources} />
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
          placeholder="输入问题，例如：这份文档主要讲了什么？"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSend) {
              send(input, topK);
              setInput("");
            }
          }}
        />
        <button
          className={[
            "rounded-xl px-5 py-3 text-sm text-white",
            canSend
              ? "bg-gray-900 hover:bg-gray-800"
              : "bg-gray-400 cursor-not-allowed",
          ].join(" ")}
          disabled={!canSend}
          onClick={() => {
            send(input, topK);
            setInput("");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<"documents" | "chat">("documents");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">RAG Studio</h1>
            <p className="mt-2 text-sm text-gray-600">
              React + TS + Zustand + Tailwind + SSE
            </p>
          </div>

          <div className="flex rounded-xl border bg-white p-1">
            <button
              className={[
                "rounded-lg px-4 py-2 text-sm",
                tab === "documents"
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-50",
              ].join(" ")}
              onClick={() => setTab("documents")}
            >
              Documents
            </button>
            <button
              className={[
                "rounded-lg px-4 py-2 text-sm",
                tab === "chat" ? "bg-gray-900 text-white" : "hover:bg-gray-50",
              ].join(" ")}
              onClick={() => setTab("chat")}
            >
              Chat
            </button>
          </div>
        </header>

        {tab === "documents" ? <DocumentsView /> : <ChatView />}
      </div>
    </div>
  );
}
