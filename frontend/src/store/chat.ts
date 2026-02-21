import { create } from 'zustand';

interface Conversation {
  id: string;
  title: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  selectedModel: string | null;
  setSelectedModel: (model: string) => void;
  updateConversation: (id: string, title: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  selectedModel: null,
  setActiveConversationId: (id: string) => set({ activeConversationId: id }),
  setSelectedModel: (model: string) => set({ selectedModel: model }),
  conversations: [],
  updateConversation: (id: string, title: string) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),
}));