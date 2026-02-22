import { useRef } from 'react'
import { toast } from 'sonner'
import { useChatStore } from '@/store/chat'
import { API_URL } from '@/constants'
import { useConversationMessages, useConversations } from './api'
import { authFetch } from '@/lib/fetch'

export function useStream(conversationId: string | null) {
  const { appendToken, clearStreaming, setIsStreaming, isStreaming } = useChatStore()
  const { mutate } = useConversationMessages(conversationId)
  const { mutate: mutateConversations } = useConversations()
  const abortRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startStream = async () => {
    if (!conversationId || abortRef.current) return

    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    // Timeout if no response within 30 seconds
    timeoutRef.current = setTimeout(() => {
      if (abortRef.current) {
        toast.error('Response timed out')
        stopStream()
      }
    }, 30000)

    try {
      const res = await authFetch(`${API_URL}/api/conversations/${conversationId}/stream`, {
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Stream error ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Clear timeout on first data received
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        buffer += decoder.decode(value, { stream: true })

        // SSE format: "data: {...}\n\n"
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = JSON.parse(trimmed.slice(6))

          if (data.error) {
            toast.error(`Generation failed: ${data.error}`)
            abortRef.current = null
            clearStreaming()
            return
          }

          if (data.done) {
            abortRef.current = null
            clearStreaming()
            mutate()
            mutateConversations()
            return
          }

          if (data.token) {
            appendToken(data.token)
          }
        }
      }
    } catch (err: unknown) {
      // AbortError is expected when we cancel intentionally
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[stream] Error:', err.message)
      }
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      abortRef.current = null
      if (isStreaming) clearStreaming()
    }
  }

  const stopStream = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    abortRef.current?.abort()
    abortRef.current = null
    clearStreaming()
  }

  return { startStream, stopStream, isStreaming }
}
