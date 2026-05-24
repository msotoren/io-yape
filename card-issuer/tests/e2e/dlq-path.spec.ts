import { GetCardStatusService } from '@/application/services/GetCardStatusService';
import { IssueCardService } from '@/application/services/IssueCardService';
import { CardStatus } from '@/domain/card/CardStatus';
import { CardsController } from '@/infrastructure/http/controllers/CardsController';
import { buildServer } from '@/infrastructure/http/server';
import { InMemoryCardRequestRepository } from '../support/InMemoryCardRequestRepository';

describe('E2E: DLQ/failure path', () => {
  it('marks request as fallido when processor exhausts retries and event is sent to DLQ', async () => {
    const repository = new InMemoryCardRequestRepository();
    const cardsController = new CardsController(
      new IssueCardService(repository),
      new GetCardStatusService(repository)
    );

    const app = await buildServer({ cardsController });

    const issueResponse = await app.inject({
      method: 'POST',
      url: '/v1/cards/issue',
      headers: { 'x-idempotency-key': 'e2e-dlq-1' },
      payload: {
        customer: {
          documentType: 'DNI',
          documentNumber: '66554433',
          fullName: 'Fail Case',
          birthDate: '02/03/1992',
          email: 'fail@example.com'
        },
        product: { type: 'VISA', currency: 'PEN' },
        forceError: true
      }
    });

    expect(issueResponse.statusCode).toBe(202);
    const requestId = issueResponse.json().requestId as string;

    // Simula el flujo async del processor hacia DLQ y compensacion en issuer
    await repository.markAsProcessing(requestId, 3);
    await repository.markAsFailed({
      requestId,
      attempts: 3,
      reason: 'Max retries (3) exceeded'
    });

    const statusResponse = await app.inject({
      method: 'GET',
      url: `/v1/cards/${requestId}/status`
    });

    expect(statusResponse.statusCode).toBe(200);
    const body = statusResponse.json();
    expect(body.status).toBe(CardStatus.FAILED);
    expect(body.attempts).toBe(3);
    expect(body.failureReason).toContain('Max retries');

    await app.close();
  });
});

