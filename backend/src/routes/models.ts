import { FastifyPluginAsync } from 'fastify'
import { getModels } from '../services/models.service'

const modelRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return getModels()
  })
}

export default modelRoutes
