import { GetCardStatusService } from '@/application/services/GetCardStatusService';
import { IssueCardService } from '@/application/services/IssueCardService';
import { CardsController } from '@/infrastructure/http/controllers/CardsController';
import { buildServer } from '@/infrastructure/http/server';
import { metricsRegistry } from '@/infrastructure/observability/metrics';
import { InMemoryCardRequestRepository } from '../support/InMemoryCardRequestRepository';

describe('E2E: observability and traceability', () => {
  it('exposes metrics and keeps request trace header across endpoint calls', async () => {
    const repository = new InMemoryCardRequestRepository();
    const cardsController = new CardsController(
      new IssueCardService(repository),
      new GetCardStatusService(repository)
    );
    const app = await buildServer({ cardsController });

    const traceId = 'trace-test-123';
    const postResponse = await app.inject({
      method: 'POST',
      url: '/v1/cards/issue',
      headers: { 'x-trace-id': traceId, 'x-idempotency-key': 'e2e-obsv-1' },
      payload: {
        customer: {
          documentType: 'DNI',
          documentNumber: '56781234',
          fullName: 'Trace User',
          birthDate: '10/10/1990',
          email: 'trace@example.com'
        },
        product: { type: 'VISA', currency: 'PEN' },
        forceError: false
      }
    });

    expect(postResponse.statusCode).toBe(202);
    expect(postResponse.headers['x-trace-id']).toBe(traceId);

    const metricsText = await metricsRegistry.metrics();
    expect(metricsText).toContain('card_issuer_http_duration_ms');

    await app.close();
  });
});

