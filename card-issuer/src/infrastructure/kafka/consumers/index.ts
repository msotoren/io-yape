import { CardRequestRepository } from '@/domain/repositories/CardRequestRepository';
import { startDLQConsumer } from '@/infrastructure/kafka/consumers/DLQEventConsumer';
import { startIssuedConsumer } from '@/infrastructure/kafka/consumers/IssuedEventConsumer';
import { startProcessingConsumer } from '@/infrastructure/kafka/consumers/ProcessingEventConsumer';

export async function startIssuerConsumers(repository: CardRequestRepository): Promise<void> {
  await Promise.all([
    startIssuedConsumer(repository),
    startProcessingConsumer(repository),
    startDLQConsumer(repository)
  ]);
}

