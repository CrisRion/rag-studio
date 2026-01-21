import { useEffect, useMemo, useState } from "react";
import { useDocStore } from "./stores/docStore";
import { useChatStore } from "./stores/chatStore";
import { useSettingsStore } from "./stores/settingsStore";

function DocumentsView() {
  const { documents, loading, uploading, error, refresh, upload } =
    useDocStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Documents</div>
          <div className="mt-1 text-sm text-gray-600">
            上传 .txt / .md 进行索引
          </div>
        </div>

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

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 text-sm font-medium text-gray-700">列表</div>
        <div className="rounded-xl border">
          <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600">
            <div className="col-span-7">Name</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Created</div>
          </div>
          {loading ? (
            <div className="px-4 py-4 text-sm text-gray-600">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-600">
              暂无文档，请先上传。
            </div>
          ) : (
            documents.map((d) => (
              <div key={d.id} className="grid grid-cols-12 px-4 py-3 text-sm">
                <div className="col-span-7 truncate">{d.name}</div>
                <div className="col-span-3">
                  <span className="rounded-lg border px-2 py-1 text-xs">
                    {d.status}
                  </span>
                </div>
                <div className="col-span-2 text-right text-xs text-gray-600">
                  {new Date(d.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SourcesCard({
  sources,
}: {
  sources: { docId: string; chunkId: string; score: number; snippet: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        className="text-xs text-gray-600 hover:text-gray-900"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide sources" : `Show sources (${sources.length})`}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((s) => (
            <div key={s.chunkId} className="rounded-xl border bg-gray-50 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="rounded-md border bg-white px-2 py-0.5">
                  doc: {s.docId}
                </span>
                <span className="rounded-md border bg-white px-2 py-0.5">
                  chunk: {s.chunkId}
                </span>
                <span className="rounded-md border bg-white px-2 py-0.5">
                  score: {s.score}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                {s.snippet}
              </div>
            </div>
          ))}
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

      <div className="mt-6 h-[420px] overflow-auto rounded-xl border p-4">
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
