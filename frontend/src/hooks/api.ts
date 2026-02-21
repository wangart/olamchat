import useSWR from 'swr'
import type { Conversation, Message, Model } from '@/types/api'
import { API_URL } from '@/constants'
import { authFetch } from '@/lib/fetch'

const fetcher = async (url: string) => {
  const res = await authFetch(url)
  if (!res.ok) {
    const error = new Error('API error')
    throw error
  }
  return res.json()
}

export const useModels = () => {
  return useSWR<Model[]>(`${API_URL}/api/models`, fetcher)
}

export const useConversations = () => {
  return useSWR<Conversation[]>(`${API_URL}/api/conversations`, fetcher)
}

export const useConversationMessages = (conversationId: string | null) => {
  return useSWR<Message[]>(
    conversationId ? `${API_URL}/api/conversations/${conversationId}/messages` : null,
    fetcher,
  )
}
