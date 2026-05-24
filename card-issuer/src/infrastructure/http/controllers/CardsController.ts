import type { FastifyReply, FastifyRequest } from 'fastify';

import { HttpStatusCode } from 'axios';

import { GetCardStatusService } from '@/application/services/GetCardStatusService';
import { IssueCardService } from '@/application/services/IssueCardService';
import { metrics } from '@/infrastructure/observability/metrics';

export class CardsController {
  constructor(
    private readonly issueCardService: IssueCardService,
    private readonly getCardStatusService: GetCardStatusService
  ) {}

  issueCard = async (request: FastifyRequest, reply: FastifyReply) => {
    const end = metrics.httpRequestDuration.startTimer({ method: 'POST', route: '/v1/cards/issue' });
    const result = await this.issueCardService.execute(request.body as never);
    metrics.cardIssuanceRequestedTotal.inc({ status: 'pending' });
    end({ status_code: String(HttpStatusCode.Accepted) });

    return reply.status(HttpStatusCode.Accepted).send({
      requestId: result.requestId,
      status: result.status,
      message: 'Card issuance request received. Poll /v1/cards/{requestId}/status for updates.',
      createdAt: new Date().toISOString()
    });
  };

  getCardStatus = async (request: FastifyRequest) => {
    const params = request.params as { requestId: string };
    return this.getCardStatusService.execute({ requestId: params.requestId });
  };
}

