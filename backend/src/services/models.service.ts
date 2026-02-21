import { db } from '../db'
import { models } from '../db/models'

export async function getModels() {
  return db
    .select()
    .from(models)
}