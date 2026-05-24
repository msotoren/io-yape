import { PgCardRequestRepository } from '@/infrastructure/database/repositories/PgCardRequestRepository';
import { startIssuerConsumers } from '@/infrastructure/kafka/consumers';
import { KafkaEventPublisher } from '@/infrastructure/kafka/KafkaEventPublisher';
import { OutboxRelayWorker } from '@/infrastructure/kafka/outbox/OutboxRelayWorker';

export async function startIssuerMessaging(): Promise<void> {
  const repository = new PgCardRequestRepository();
  const eventPublisher = new KafkaEventPublisher();
  await eventPublisher.connect();

  const relay = new OutboxRelayWorker(repository, eventPublisher);
  await relay.start();
  await startIssuerConsumers(repository);
}

