import { EventPublisher } from '@/domain/ports/EventPublisher';
import { EventTopic } from '@/domain/events/EventTopic';
import { PgCardRequestRepository } from '@/infrastructure/database/repositories/PgCardRequestRepository';
import { OutboxSignal } from './OutboxSignal';
import { outboxEmitter } from './outbox.emitter';

export class OutboxRelayWorker {
  private running = false;
  private draining = false;

  constructor(
    private readonly repository: PgCardRequestRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async start(): Promise<void> {
    this.running = true;
    outboxEmitter.on(OutboxSignal.NEW_EVENT, this.onNewEvent);
    void this.drainOutbox();
  }

  private readonly onNewEvent = (): void => {
    void this.drainOutbox();
  };

  private async drainOutbox(): Promise<void> {
    if (!this.running || this.draining) {
      return;
    }

    this.draining = true;

    try {
      const events = await this.repository.getPendingOutbox(10);
      for (const event of events) {
        const cloudEvent = {
          id: String(event.id),
          source: 'card-issuer',
          specversion: '1.0',
          type: event.topic,
          datacontenttype: 'application/json',
          time: new Date().toISOString(),
          data: event.payload
        };

        await this.eventPublisher.publish(event.topic as EventTopic, event.partitionKey, cloudEvent);
        await this.repository.markOutboxAsPublished(event.id);
      }
    } finally {
      this.draining = false;
    }
  }

  stop(): void {
    this.running = false;
    outboxEmitter.off(OutboxSignal.NEW_EVENT, this.onNewEvent);
  }
}


