import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

export function publishToken(conversationId: string, token: string) {
  redis.publish(`stream:${conversationId}`, JSON.stringify({ token }))
}

export function publishDone(conversationId: string) {
  redis.publish(`stream:${conversationId}`, JSON.stringify({ done: true }))
}

export function publishError(conversationId: string, message: string) {
  redis.publish(`stream:${conversationId}`, JSON.stringify({ error: message }))
}

export { redis }
