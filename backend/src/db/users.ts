import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { conversations } from './conversations'

// ── Users ────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Relations ────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
}))
