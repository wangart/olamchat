// Mirror of backend API response types
// Keep in sync with backend/src/db schema

export interface Model {
  id: string
  modelName: string
  modelDescription: string
}

export interface Conversation {
  id: string
  title: string
  modelId: string | null
  userId: string
  systemPrompt: string | null
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}
