import { CardRequestRepository } from '@/domain/repositories/CardRequestRepository';
import { EventTopic } from '@/domain/events/EventTopic';
import { issuerKafka } from '../kafka.client';

export async function startIssuedConsumer(repository: CardRequestRepository): Promise<void> {
  const consumer = issuerKafka.consumer({ groupId: 'card-issuer-issued-grp' });
  await consumer.connect();
  await consumer.subscribe({ topic: EventTopic.CARD_ISSUED, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString());
      const data = payload.data ?? payload;
      await repository.markAsIssued({
        requestId: data.requestId,
        attempts: data.processingDetails?.attempts ?? 1,
        card: {
          id: data.card.id,
          maskedNumber: data.card.maskedNumber,
          expiryDate: data.card.expiryDate,
          issuedAt: data.card.issuedAt
        }
      });
    }
  });
}


