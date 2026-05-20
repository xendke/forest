import 'dotenv/config'
import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import mercurius from 'mercurius'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'

let app: FastifyInstance | undefined

async function buildApp(): Promise<FastifyInstance> {
  if (app) return app

  app = Fastify({ logger: true })

  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: !process.env.VERCEL,
    context: (request) => ({
      authHeader: request.headers.authorization,
    }),
  })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}

// Vercel: export a handler instead of binding a port
export default async function handler(req: any, res: any) {
  const fastify = await buildApp()
  await fastify.ready()
  fastify.server.emit('request', req, res)
}

// Local dev only
if (!process.env.VERCEL) {
  buildApp()
    .then((fastify) =>
      fastify.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' })
    )
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
