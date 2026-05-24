import type { FastifyReply, FastifyRequest } from 'fastify';

import { HttpStatusCode } from 'axios';

import { ConflictError } from '@/shared/errors/ConflictError';
import { DomainError } from '@/shared/errors/DomainError';
import { NotFoundError } from '@/shared/errors/NotFoundError';

export function errorHandler(error: Error, _request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof ConflictError) {
    reply.status(HttpStatusCode.Conflict).send({
      statusCode: HttpStatusCode.Conflict,
      error: 'Conflict',
      code: error.code,
      message: error.message,
      ...error.metadata
    });
    return;
  }

  if (error instanceof DomainError) {
    reply
      .status(HttpStatusCode.UnprocessableEntity)
      .send({ statusCode: HttpStatusCode.UnprocessableEntity, error: 'Unprocessable Entity', message: error.message });
    return;
  }

  if (error instanceof NotFoundError) {
    reply.status(HttpStatusCode.NotFound).send({ statusCode: HttpStatusCode.NotFound, error: 'Not Found', message: error.message });
    return;
  }

  reply
    .status(HttpStatusCode.InternalServerError)
    .send({ statusCode: HttpStatusCode.InternalServerError, error: 'Internal Server Error', message: error.message });
}

