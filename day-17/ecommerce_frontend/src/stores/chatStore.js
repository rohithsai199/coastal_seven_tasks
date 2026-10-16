import { create } from "zustand";

export const useChatStore = create((set) => ({
  messages: [],
  unreadByOrder: {},
  isConnected: false,
  sendMessage: null,

  setConnection: (isConnected) => set({ isConnected }),

  setSendMessage: (sendMessage) => set({ sendMessage }),

  addIncomingMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      unreadByOrder:
        message.order_id == null
          ? state.unreadByOrder
          : {
              ...state.unreadByOrder,
              [message.order_id]:
                (state.unreadByOrder[message.order_id] || 0) + 1,
            },
    })),

  addLocalMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  markOrderRead: (orderId) =>
    set((state) => ({
      unreadByOrder: {
        ...state.unreadByOrder,
        [orderId]: 0,
      },
    })),

  reset: () =>
    set({
      messages: [],
      unreadByOrder: {},
      isConnected: false,
      sendMessage: null,
    }),
}));
