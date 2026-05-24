import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: 5,
    timeWindow: '1 minute',
    keyGenerator: (request) => `${request.ip}:${request.routeOptions.url ?? request.url}`,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${context.after}.`,
      retryAfter: context.after
    }),
    allowList: ['GET /health', 'GET /metrics']
  });
}


