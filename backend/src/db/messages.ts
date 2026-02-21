import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { conversations } from './conversations'

// ── Enums ────────────────────────────────────────────────

export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'system',
])

// ── Messages ─────────────────────────────────────────────

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('messages_conversation_id_idx').on(table.conversationId),
  index('messages_conv_created_idx').on(table.conversationId, table.createdAt),
])

// ── Relations ────────────────────────────────────────────

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))