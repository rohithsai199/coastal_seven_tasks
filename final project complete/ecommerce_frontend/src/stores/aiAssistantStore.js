import { create } from "zustand";
import { getAIStatus } from "../services/aiService";

export const useAIAssistantStore = create((set, get) => ({
  isOpen: false,
  isSettingsOpen: false,
  provider: localStorage.getItem("aura_ai_provider") || "auto",
  apiKey: localStorage.getItem("aura_ai_api_key") || "",
  isStreaming: false,
  statusData: null,
  abortController: null,
  messages: [
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "👋 Welcome to **ARISE**! I am **Aura**, your personal AI shopping concierge powered by **Google Gemini**. " +
        "Explore our curated collections in **Boys**, **Girls**, **Kids**, **Accessories**, and **Beauty**. " +
        "Ask me about any styles, tailoring, pricing, stock availability, or recommendations!",
      citations: [],
      metadata: { provider: "Google Gemini", fallback_used: false },
    },
  ],

  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  toggleSettingsOpen: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  setProvider: (provider) => {
    localStorage.setItem("aura_ai_provider", provider);
    set({ provider });
  },

  setApiKey: (apiKey) => {
    localStorage.setItem("aura_ai_api_key", apiKey);
    set({ apiKey });
  },

  setStreaming: (isStreaming) => set({ isStreaming }),

  setAbortController: (abortController) => set({ abortController }),

  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isStreaming: false, abortController: null });
  },

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: msg.role,
          content: msg.content || "",
          citations: msg.citations || [],
          metadata: msg.metadata || null,
          isStreaming: Boolean(msg.isStreaming),
          error: msg.error || null,
        },
      ],
    })),

  updateLastMessage: (updater) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIdx = state.messages.length - 1;
      const currentLast = state.messages[lastIdx];
      const updated = typeof updater === "function" ? updater(currentLast) : { ...currentLast, ...updater };
      const newMessages = [...state.messages];
      newMessages[lastIdx] = updated;
      return { messages: newMessages };
    }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: "Chat cleared! How can I assist your shopping journey today?",
          citations: [],
          metadata: { provider: "Aura System" },
        },
      ],
    }),

  fetchStatus: async () => {
    try {
      const data = await getAIStatus();
      set({ statusData: data });
      return data;
    } catch {
      // Ignore network errors on passive status check
    }
  },
}));
