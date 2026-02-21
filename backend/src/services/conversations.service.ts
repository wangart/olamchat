import { db } from '../db'
import { conversations, messages } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getUserConversations() {
  return db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
}

export async function createConversation(modelId: string) {
  const [conv] = await db
  .insert(conversations )
  .values({ modelId })
    .returning({ id: conversations.id })
  return conv
}

export async function editConversation(conversationId: string, title: string) {
  const [conv] = await db
    .update(conversations)
    .set({ title })
    .where(eq(conversations.id, conversationId))
    .returning({ id: conversations.id })
  return conv
}

export async function deleteConversation(conversationId: string) {
  await db
    .delete(conversations)
    .where(eq(conversations.id, conversationId))
}

export async function getConversationMessages(conversationId: string) {
  console.log('getConversationMessages', conversationId);
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
}