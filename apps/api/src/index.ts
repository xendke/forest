import Fastify from 'fastify'
import cors from '@fastify/cors'
import mercurius from 'mercurius'

const app = Fastify({ logger: true })

const schema = `
  type Query {
    hello: String!
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello from Fastify + GraphQL!',
  },
}

async function start() {
  await app.register(cors)
  await app.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.listen({ port: 4000, host: '0.0.0.0' })
}

start().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
