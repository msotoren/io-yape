import { CardRequestRepository } from '@/domain/repositories/CardRequestRepository';
import { EventTopic } from '@/domain/events/EventTopic';
import { issuerKafka } from '../kafka.client';

export async function startDLQConsumer(repository: CardRequestRepository): Promise<void> {
  const consumer = issuerKafka.consumer({ groupId: 'card-issuer-dlq-grp' });
  await consumer.connect();
  await consumer.subscribe({ topic: EventTopic.CARD_REQUESTED_DLQ, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString());
      const data = payload.data ?? payload;
      await repository.markAsFailed({
        requestId: data.requestId,
        attempts: data.error?.attempts ?? 3,
        reason: data.error?.reason ?? 'Max retries exceeded'
      });
    }
  });
}


