import { GetCardStatusService } from '@/application/services/GetCardStatusService';
import { IssueCardService } from '@/application/services/IssueCardService';
import { CardsController } from '@/infrastructure/http/controllers/CardsController';
import { buildServer } from '@/infrastructure/http/server';
import { InMemoryCardRequestRepository } from '../support/InMemoryCardRequestRepository';

describe('Integration: cards endpoints', () => {
  it('POST /v1/cards/issue responds 202 and GET status responds 200', async () => {
    const repository = new InMemoryCardRequestRepository();
    const cardsController = new CardsController(
      new IssueCardService(repository),
      new GetCardStatusService(repository)
    );

    const app = await buildServer({ cardsController });

    const issueResponse = await app.inject({
      method: 'POST',
      url: '/v1/cards/issue',
      headers: { 'x-idempotency-key': 'it-1' },
      payload: {
        customer: {
          documentType: 'DNI',
          documentNumber: '12345678',
          fullName: 'Jose Perez',
          birthDate: '02/03/2000',
          email: 'jose@example.com'
        },
        product: { type: 'VISA', currency: 'PEN' },
        forceError: false
      }
    });

    expect(issueResponse.statusCode).toBe(202);
    const issueBody = issueResponse.json();

    const statusResponse = await app.inject({
      method: 'GET',
      url: `/v1/cards/${issueBody.requestId}/status`
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json().status).toBe('pendiente');

    await app.close();
  });
});

