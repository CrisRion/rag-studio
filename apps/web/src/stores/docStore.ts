import { create } from "zustand";
import { getDocuments, uploadDocument } from "../lib/api";
import { getErrorMessage } from "../lib/api"; // 如果你把 getErrorMessage 放在 api.ts

export type DocumentItem = {
  id: string;
  name: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  createdAt: number;
};

type DocState = {
  documents: DocumentItem[];
  loading: boolean;
  uploading: boolean;
  error?: string;

  refresh: () => Promise<void>;
  upload: (file: File) => Promise<void>;
};

export const useDocStore = create<DocState>((set, get) => ({
  documents: [],
  loading: false,
  uploading: false,
  error: undefined,

  refresh: async () => {
    set({ loading: true, error: undefined });
    try {
      const docs = (await getDocuments()) as DocumentItem[];
      set({ documents: docs, loading: false });
    } catch (e: unknown) {
      set({
        loading: false,
        error: getErrorMessage(e) || "Failed to load documents",
      });
    }
  },

  upload: async (file: File) => {
    set({ uploading: true, error: undefined });
    try {
      await uploadDocument(file);
      set({ uploading: false });
      await get().refresh();
    } catch (e: unknown) {
      set({
        uploading: false,
        error: getErrorMessage(e) || "Upload failed",
      });
    }
  },
}));
