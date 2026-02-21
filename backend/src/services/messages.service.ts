import { messages } from "../db/schema"
import { db } from "../db"
import { inferenceQueue } from "../lib/queue"

export async function createMessage(conversationId: string, content: string) {
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