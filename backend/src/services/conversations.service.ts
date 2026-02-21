import { db } from '../db'
import { conversations, messages } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function getUserConversations(userId: string) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
}

export async function createConversation(userId: string, modelId: string) {
  const [conv] = await db
    .insert(conversations)
    .values({ userId, modelId })
    .returning({ id: conversations.id })
  return conv
}

export async function editConversation(userId: string, conversationId: string, title: string) {
  const [conv] = await db
    .update(conversations)
    .set({ title })
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .returning({ id: conversations.id })
  return conv
}

export async function deleteConversation(userId: string, conversationId: string) {
  await db
    .delete(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
}

export async function getConversationMessages(userId: string, conversationId: string) {
  // Verify ownership
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1)

  if (!conv) {
    throw new Error('Conversation not found')
  }

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
}
