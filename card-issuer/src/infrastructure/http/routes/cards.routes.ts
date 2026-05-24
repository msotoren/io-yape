import type { FastifyInstance } from 'fastify';

import { CardsController } from '@/infrastructure/http/controllers/CardsController';
import { idempotencyMiddleware } from '@/infrastructure/http/middleware/idempotency.middleware';
import { issueCardSchema } from '../schemas/issue-card.schema';

export async function registerCardRoutes(
  app: FastifyInstance,
  deps: { cardsController: CardsController }
): Promise<void> {
  app.post(
    '/v1/cards/issue',
    { schema: issueCardSchema, preHandler: idempotencyMiddleware },
    deps.cardsController.issueCard
  );
  app.get('/v1/cards/:requestId/status', deps.cardsController.getCardStatus);
}

