import { create } from "zustand";
import { streamChat, type Source } from "../lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

type ChatState = {
  messages: Message[];
  isGenerating: boolean;
  error?: string;
  stop?: () => void;

  send: (question: string, topK: number) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isGenerating: false,

  clear: () => set({ messages: [], error: undefined }),

  send: (question, topK) => {
    const q = question.trim();
    if (!q) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    set({
      messages: [...get().messages, userMsg, assistantMsg],
      isGenerating: true,
      error: undefined,
    });

    const close = streamChat({ question: q, topK }, (evt) => {
      if (evt.type === "token") {
        const { token } = evt.data;
        set({
          messages: get().messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        });
      }

      if (evt.type === "done") {
        set({
          isGenerating: false,
          stop: undefined,
          messages: get().messages.map((m) =>
            m.id === assistantId ? { ...m, sources: evt.data.sources } : m,
          ),
        });
      }

      if (evt.type === "error") {
        set({ isGenerating: false, stop: undefined, error: evt.data.message });
      }
    });

    set({ stop: close });
  },
}));
