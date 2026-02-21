import {
  pgTable,
  uuid,
  text,
  varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { conversations } from './conversations'

// ── Models ────────────────────────────────────────────────

export const models = pgTable('models', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelName: varchar('model_name', { length: 255 }).unique().notNull(),
  modelDescription: text('model_description').notNull(),
})

export type Model = typeof models.$inferSelect

// ── Relations ────────────────────────────────────────────

export const modelsRelations = relations(models, ({ many }) => ({
  conversations: many(conversations),
}))