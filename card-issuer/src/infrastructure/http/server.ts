import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

import { GetCardStatusService } from '@/application/services/GetCardStatusService';
import { IssueCardService } from '@/application/services/IssueCardService';
import { PgCardRequestRepository } from '@/infrastructure/database/repositories/PgCardRequestRepository';
import { CardsController } from '@/infrastructure/http/controllers/CardsController';
import { registerCardRoutes } from './routes/cards.routes';
import { registerHealthRoutes } from './routes/health.routes';
import { registerMetricsRoute } from './routes/metrics.routes';
import { registerRateLimit } from './plugins/rate-limit.plugin';
import { registerSwagger } from './plugins/swagger.plugin';
import { errorHandler } from './middleware/error-handler.middleware';

export async function buildServer(input?: { cardsController?: CardsController }) {
  const repository = new PgCardRequestRepository();
  const cardsController =
    input?.cardsController ?? new CardsController(new IssueCardService(repository), new GetCardStatusService(repository));

  const app = Fastify({ logger: true });

  app.addHook('onRequest', async (request, reply) => {
    const traceId = (request.headers['x-trace-id'] as string | undefined) ?? randomUUID();
    reply.header('x-trace-id', traceId);
  });

  await registerSwagger(app);
  await registerRateLimit(app);
  await registerCardRoutes(app, { cardsController });
  await registerHealthRoutes(app);
  await registerMetricsRoute(app);
  app.setErrorHandler(errorHandler);

  return app;
}

