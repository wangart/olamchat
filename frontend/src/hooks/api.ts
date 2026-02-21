import useSWR from 'swr';
import type { Conversation, Message, Model } from '@/types/api';
import { API_URL } from '@/constants';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const useModels = () => {
  return useSWR<Model[]>(`${API_URL}/api/models`, fetcher);
};

export const useConversations = () => {
  return useSWR<Conversation[]>(`${API_URL}/api/conversations`, fetcher);
};

export const useConversationMessages = (conversationId: string | null) => {
  const fetcher = (url: string) => {
    if (!conversationId) return [];
    return fetch(`${API_URL}/api/conversations/${conversationId}/messages`).then(res => res.json());
  };
  return useSWR<Message[]>(conversationId ? `${API_URL}/api/conversations/${conversationId}/messages` : null, fetcher);
};