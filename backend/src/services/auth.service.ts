import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'

const SALT_ROUNDS = 10

export async function signup(email: string, password: string) {
  // Check if user already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    throw new Error('Email already in use')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email })

  return user
}

export async function login(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw new Error('Invalid credentials')
  }

  return { id: user.id, email: user.email }
}
