import { eq, asc } from 'drizzle-orm'
import { db } from './db'
import { messages, conversations } from '../../backend/src/db/schema'
import { chatCompletionStream } from './ollama'
import type { Job } from 'bullmq'
import { publishToken, publishDone } from './redis'

export interface InferenceJobData {
  conversationId: string
  messageId: string
}

export async function processInferenceJob(job: Job<InferenceJobData>) {
  const { conversationId } = job.data
  console.log(`[worker] Processing job ${job.id} for conversation ${conversationId}`)

  // 1. Fetch the conversation (for system prompt)
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`)
  }

  // 2. Fetch all messages ordered by time
  const history = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  // 3. Build prompt: system prompt (if any) + conversation history
  const promptMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []

  if (conversation.systemPrompt) {
    promptMessages.push({ role: 'system', content: conversation.systemPrompt })
  }

  for (const msg of history) {
    promptMessages.push({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })
  }

  // 4. Stream from Ollama, publishing each token to Redis
  const model = 'qwen3:8b'
  console.log(
    `[worker] Streaming from Ollama with ${promptMessages.length} messages, model: ${model}`,
  )
  const assistantContent = await chatCompletionStream(model, promptMessages, (token) =>
    publishToken(conversationId, token),
  )

  // 5. Signal completion
  publishDone(conversationId)

  // 5. Save the assistant response
  const [saved] = await db
    .insert(messages)
    .values({
      conversationId,
      role: 'assistant',
      content: assistantContent,
    })
    .returning({ id: messages.id })

  console.log(`[worker] Saved assistant message ${saved.id}`)
  return { messageId: saved.id }
}
