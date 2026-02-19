import { create } from 'zustand';

interface Conversation {
  id: string;
  title: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  setActiveConversationId: (id: string) => set({ activeConversationId: id }),
  conversations: [],
  addConversation: (conversation: Conversation) => set(state => ({ conversations: [...state.conversations, conversation] })),
  removeConversation: (id: string) => set(state => ({ conversations: state.conversations.filter(c => c.id !== id) })),
  updateConversation: (id: string, title: string) => set(state => ({ conversations: state.conversations.map(c => c.id === id ? { ...c, title } : c) })),
}));