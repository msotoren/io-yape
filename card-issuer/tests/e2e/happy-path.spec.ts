import { GetCardStatusService } from '@/application/services/GetCardStatusService';
import { IssueCardService } from '@/application/services/IssueCardService';
import { CardStatus } from '@/domain/card/CardStatus';
import { CardsController } from '@/infrastructure/http/controllers/CardsController';
import { buildServer } from '@/infrastructure/http/server';
import { InMemoryCardRequestRepository } from '../support/InMemoryCardRequestRepository';

describe('E2E: happy path', () => {
  it('issues request and transitions to emitido after simulated event handling', async () => {
    const repository = new InMemoryCardRequestRepository();
    const cardsController = new CardsController(
      new IssueCardService(repository),
      new GetCardStatusService(repository)
    );

    const app = await buildServer({ cardsController });

    const issueResponse = await app.inject({
      method: 'POST',
      url: '/v1/cards/issue',
      headers: { 'x-idempotency-key': 'e2e-happy-1' },
      payload: {
        customer: {
          documentType: 'DNI',
          documentNumber: '87654321',
          fullName: 'Ana Perez',
          birthDate: '01/01/1995',
          email: 'ana@example.com'
        },
        product: { type: 'VISA', currency: 'USD' },
        forceError: false
      }
    });

    const requestId = issueResponse.json().requestId as string;

    await repository.markAsProcessing(requestId, 1);
    await repository.markAsIssued({
      requestId,
      attempts: 1,
      card: {
        id: 'card_1',
        maskedNumber: '4532 **** **** 1234',
        expiryDate: '12/28',
        issuedAt: new Date().toISOString()
      }
    });

    const statusResponse = await app.inject({
      method: 'GET',
      url: `/v1/cards/${requestId}/status`
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json().status).toBe(CardStatus.ISSUED);

    await app.close();
  });
});

