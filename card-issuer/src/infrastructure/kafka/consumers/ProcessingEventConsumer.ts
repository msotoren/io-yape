import { CardRequestRepository } from '@/domain/repositories/CardRequestRepository';
import { EventTopic } from '@/domain/events/EventTopic';
import { issuerKafka } from '../kafka.client';

export async function startProcessingConsumer(repository: CardRequestRepository): Promise<void> {
  const consumer = issuerKafka.consumer({ groupId: 'card-issuer-processing-grp' });
  await consumer.connect();
  await consumer.subscribe({ topic: EventTopic.CARD_PROCESSING, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString());
      const data = payload.data ?? payload;
      await repository.markAsProcessing(data.requestId, data.attempt);
    }
  });
}


