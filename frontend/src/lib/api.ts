import useSWRMutation from 'swr/mutation'
import { useSWRConfig } from 'swr'
import { API_URL } from '@/constants'
import type { Conversation, Message, User } from '@/types/api'
import { authFetch } from '@/lib/fetch'

// ─── Auth ────────────────────────────────────────────────

interface AuthResponse {
  token: string
  user: User
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Login failed')
  }
  const data: AuthResponse = await res.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Signup failed')
  }
  const data: AuthResponse = await res.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  return JSON.parse(raw)
}

// ─── Conversations ───────────────────────────────────────

const CONVERSATIONS_KEY = `${API_URL}/api/conversations`

export function useCreateConversation() {
  return useSWRMutation(
    CONVERSATIONS_KEY,
    async (url: string, { arg }: { arg: { model: string } }) => {
      const response = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: arg.model }),
      })
      if (!response.ok) throw new Error('Failed to create conversation')
      return response.json() as Promise<Conversation>
    },
    {
      optimisticData: (current?: Conversation[]) => [
        {
          id: `temp-${Date.now()}`,
          title: 'New Conversation',
          modelId: null,
          systemPrompt: null,
          userId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...(current ?? []),
      ],
      rollbackOnError: true,
      revalidate: true,
    },
  )
}

export function useEditConversation() {
  const { mutate } = useSWRConfig()

  return useSWRMutation(
    CONVERSATIONS_KEY,
    async (_url: string, { arg }: { arg: { id: string; title: string } }) => {
      const response = await authFetch(`${API_URL}/api/conversations/${arg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: arg.title }),
      })
      if (!response.ok) throw new Error('Failed to edit conversation')
      return response.json() as Promise<Conversation>
    },
    {
      onSuccess: () => mutate(CONVERSATIONS_KEY),
      onError: () => mutate(CONVERSATIONS_KEY),
    },
  )
}

export function useDeleteConversation() {
  const { mutate } = useSWRConfig()

  return useSWRMutation(
    CONVERSATIONS_KEY,
    async (_url: string, { arg }: { arg: { id: string } }) => {
      const response = await authFetch(`${API_URL}/api/conversations/${arg.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete conversation')
    },
    {
      onSuccess: () => mutate(CONVERSATIONS_KEY),
      onError: () => mutate(CONVERSATIONS_KEY),
    },
  )
}

export function useCreateMessage(conversationId: string | null) {
  const messagesKey = conversationId
    ? `${API_URL}/api/conversations/${conversationId}/messages`
    : null

  return useSWRMutation(
    messagesKey,
    async (_url: string, { arg }: { arg: { content: string } }) => {
      const response = await authFetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: arg.content }),
      })
      if (!response.ok) throw new Error('Failed to create message')
      return response.json() as Promise<Message>
    },
    {
      revalidate: true,
      rollbackOnError: true,
    },
  )
}
