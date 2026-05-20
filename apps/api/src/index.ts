import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import mercurius from 'mercurius'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'

const app = Fastify({ logger: true })

async function start() {
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: true,
    context: (request) => ({
      authHeader: request.headers.authorization,
    }),
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.listen({ port: 4000, host: '0.0.0.0' })
}

start().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
