import { pgTable, uuid, text, timestamp, varchar, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { messages } from './messages'
import { models } from './models'
import { users } from './users'

// ── Conversations ────────────────────────────────────────

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).default('New Conversation'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    modelId: uuid('model_id').references(() => models.id, { onDelete: 'set null' }),
    systemPrompt: text('system_prompt'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('conversations_user_updated_idx').on(table.userId, table.updatedAt)],
)

// ── Relations ────────────────────────────────────────────

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  messages: many(messages),
  model: one(models, {
    fields: [conversations.modelId],
    references: [models.id],
  }),
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
}))
