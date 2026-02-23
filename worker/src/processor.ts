import { eq, asc } from 'drizzle-orm'
import { db } from './db'
import { messages, conversations, models } from '../../backend/src/db/schema'
import { chatCompletion, chatCompletionStream } from './ollama'
import type { Job } from 'bullmq'
import { publishToken, publishDone, publishError } from './redis'

export interface InferenceJobData {
  conversationId: string
  messageId: string
}

export async function processInferenceJob(job: Job<InferenceJobData>) {
  const { conversationId } = job.data
  console.log(
    `[worker:${process.pid}] Processing job ${job.id} for conversation ${job.data.conversationId}`,
  )

  // 1. Fetch the conversation with its model
  const [conversation] = await db
    .select({
      id: conversations.id,
      systemPrompt: conversations.systemPrompt,
      temperature: conversations.temperature,
      maxTokens: conversations.maxTokens,
      modelName: models.modelName,
    })
    .from(conversations)
    .leftJoin(models, eq(conversations.modelId, models.id))
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

  // 4. Stream from LLM, publishing each token to Redis
  const model = conversation.modelName ?? 'stepfun/step-3.5-flash:free'
  console.log(`[worker] Streaming from LLM with ${promptMessages.length} messages, model: ${model}`)

  try {
    const assistantContent = await chatCompletionStream(
      model,
      promptMessages,
      (token) => publishToken(conversationId, token),
      {
        temperature: conversation.temperature ?? 0.7,
        maxTokens: conversation.maxTokens ?? 2048,
      },
    )

    // 5. Signal completion
    publishDone(conversationId)

    // 6. Save the assistant response
    const [saved] = await db
      .insert(messages)
      .values({
        conversationId,
        role: 'assistant',
        content: assistantContent,
      })
      .returning({ id: messages.id })

    console.log(`[worker] Saved assistant message ${saved.id}`)

    // 7. Auto-generate title if this is the first exchange
    if (history.length === 1) {
      try {
        const title = await chatCompletion(model, [
          {
            role: 'system',
            content:
              'Generate a short title (max 6 words) for this conversation. Return ONLY the title, no quotes, no punctuation at the end.',
          },
          { role: 'user', content: history[0].content },
          { role: 'assistant', content: assistantContent },
        ])

        await db
          .update(conversations)
          .set({ title: title.trim().slice(0, 255) })
          .where(eq(conversations.id, conversationId))

        console.log(`[worker] Auto-titled conversation: "${title.trim()}"`)
      } catch (err) {
        console.error('[worker] Failed to generate title:', err)
      }
    }

    return { messageId: saved.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[worker] Inference failed:`, message)
    publishError(conversationId, message)
    throw err
  }
}
