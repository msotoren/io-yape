import { CardRequest } from '@/domain/card/CardRequest';
import { CardStatus } from '@/domain/card/CardStatus';
import {
  ActiveCard,
  CardStatusView,
  CardRequestRepository
} from '@/domain/repositories/CardRequestRepository';

export class InMemoryCardRequestRepository implements CardRequestRepository {
  private requests = new Map<string, CardStatusView>();
  private outbox: Array<{ id: number; topic: string; partitionKey: string; payload: unknown }> = [];
  private outboxId = 1;

  async findActiveByDocumentNumber(documentNumber: string): Promise<ActiveCard | null> {
    for (const request of this.requests.values()) {
      if (
        request.customer.documentNumber === documentNumber &&
        [CardStatus.PENDING, CardStatus.PROCESSING, CardStatus.ISSUED].includes(request.status as CardStatus)
      ) {
        return { requestId: request.requestId, status: request.status };
      }
    }

    return null;
  }

  async saveWithOutbox(request: CardRequest): Promise<void> {
    const now = new Date().toISOString();
    this.requests.set(request.requestId, {
      requestId: request.requestId,
      status: request.status,
      attempts: 0,
      failureReason: null,
      card: null,
      customer: { documentNumber: request.documentNumber, fullName: request.fullName },
      product: { type: request.cardType, currency: request.currency },
      createdAt: now,
      updatedAt: now
    });

    this.outbox.push({
      id: this.outboxId++,
      topic: 'io.card.requested.v1',
      partitionKey: request.documentNumber,
      payload: { requestId: request.requestId }
    });
  }

  async getStatusByRequestId(requestId: string): Promise<CardStatusView | null> {
    return this.requests.get(requestId) ?? null;
  }

  async markAsProcessing(requestId: string, attempts: number): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) return;
    request.status = CardStatus.PROCESSING;
    request.attempts = attempts;
    request.updatedAt = new Date().toISOString();
  }

  async markAsIssued(input: {
    requestId: string;
    attempts: number;
    card: { id: string; maskedNumber: string; expiryDate: string; issuedAt: string };
  }): Promise<void> {
    const request = this.requests.get(input.requestId);
    if (!request) return;
    request.status = CardStatus.ISSUED;
    request.attempts = input.attempts;
    request.card = input.card;
    request.updatedAt = new Date().toISOString();
  }

  async markAsFailed(input: { requestId: string; attempts: number; reason: string }): Promise<number> {
    const request = this.requests.get(input.requestId);
    if (!request) return 0;
    request.status = CardStatus.FAILED;
    request.attempts = input.attempts;
    request.failureReason = input.reason;
    request.updatedAt = new Date().toISOString();
    return 1;
  }

  async getPendingOutbox(limit: number): Promise<Array<{ id: number; topic: string; partitionKey: string; payload: unknown }>> {
    return this.outbox.slice(0, limit);
  }

  async markOutboxAsPublished(id: number): Promise<void> {
    this.outbox = this.outbox.filter((event) => event.id !== id);
  }
}

