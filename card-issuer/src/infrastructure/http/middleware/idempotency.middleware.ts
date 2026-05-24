import type { FastifyReply, FastifyRequest } from 'fastify';

import { HttpStatusCode } from 'axios';

import { redisClient } from '@/infrastructure/cache/redis.client';
import { ErrorCode } from '@/shared/errors/ErrorCode';

const IDEMPOTENCY_TTL_SECONDS = 600;

export async function idempotencyMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const key = request.headers['x-idempotency-key'];

  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    reply.status(HttpStatusCode.BadRequest).send({
      statusCode: HttpStatusCode.BadRequest,
      code: ErrorCode.IDEMPOTENCY_KEY_REQUIRED,
      error: 'Bad Request',
      message: 'x-idempotency-key header is required'
    });

    return;
  }

  const redisKey = `idem:${key}`;
  const created = await redisClient.set(redisKey, '1', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');

  if (!created) {
    reply.status(HttpStatusCode.Conflict).send({
      statusCode: HttpStatusCode.Conflict,
      code: ErrorCode.IDEMPOTENCY_KEY_ALREADY_USED,
      error: 'Conflict',
      message: 'Idempotency key already used'
    });
  }
}


