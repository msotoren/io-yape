import type { FastifyInstance } from 'fastify';

export async function registerMetricsRoute(app: FastifyInstance): Promise<void> {
  app.get('/metrics', async (_request, reply) => {
    reply.status(307).header('Location', 'http://localhost:9091/metrics').send();
  });
}

