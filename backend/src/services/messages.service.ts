import { conversations, messages } from '../db/schema'
import { db } from '../db'
import { inferenceQueue } from '../lib/queue'
import { and, eq } from 'drizzle-orm'

export async function createMessage(userId: string, conversationId: string, content: string) {
  // Verify the conversation belongs to this user
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conv) {
    throw new Error('Conversation not found')
  }

  const [msg] = await db
    .insert(messages)
    .values({ conversationId, role: 'user', content })
    .returning({ id: messages.id })

  await inferenceQueue.add('inference', {
    conversationId,
    messageId: msg.id,
  })

  return msg
}
