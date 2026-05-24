import { ProcessCardIssuanceService } from '@/application/services/ProcessCardIssuanceService';
import { CardStatus } from '@/domain/card/CardStatus';
import { EventTopic } from '@/domain/events/EventTopic';
import { DLQProducer } from '@/infrastructure/kafka/producers/DLQProducer';
import { IssuedEventProducer } from '@/infrastructure/kafka/producers/IssuedEventProducer';
import { ProcessingEventProducer } from '@/infrastructure/kafka/producers/ProcessingEventProducer';
import { processorMetrics } from '@/infrastructure/observability/metrics';
import { processWithRetry } from '@/shared/retry/RetryEngine';
import { processorKafka } from '../kafka.client';

export async function startCardRequestedConsumer(
  processor: ProcessCardIssuanceService,
  issuedProducer: IssuedEventProducer,
  processingProducer: ProcessingEventProducer,
  dlqProducer: DLQProducer
): Promise<void> {
  const consumer = processorKafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID ?? 'card-processor-grp'
  });

  await consumer.connect();
  await consumer.subscribe({ topic: EventTopic.CARD_REQUESTED, fromBeginning: false });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;
      const raw = JSON.parse(message.value.toString());
      const data = raw.data ?? raw;
      const end = processorMetrics.processingDuration.startTimer();

      const outcome = await processWithRetry({
        event: {
          requestId: data.requestId,
          customer: data.customer,
          forceError: Boolean(data.forceError),
          sourceEvent: raw
        },
        processor,
        dlqProducer,
        processingProducer,
        onIssued: async (issued) => {
          await issuedProducer.publish(
            {
              requestId: issued.requestId,
              status: CardStatus.ISSUED,
              card: {
                id: issued.card.id,
                maskedNumber: issued.card.maskedNumber,
                expiryDate: issued.card.expiryDate,
                cvvHash: issued.card.cvvHash,
                issuedAt: new Date().toISOString()
              },
              processingDetails: {
                attempts: issued.attempts,
                processingTimeMs: issued.processingTimeMs
              },
              error: {}
            },
            data.customer.documentNumber
          );
          end({ outcome: 'issued' });
        }
      });

      for (let retryNumber = 1; retryNumber <= outcome.retries; retryNumber++) {
        processorMetrics.retryTotal.inc({ attempt_number: String(retryNumber) });
      }

      if (outcome.outcome === 'failed_dlq') {
        processorMetrics.dlqPublishedTotal.inc({ reason: 'max_retries' });
        end({ outcome: 'failed_dlq' });
      }


      if (message.offset) {
        await consumer.commitOffsets([{ topic, partition, offset: String(Number(message.offset) + 1) }]);
      }
    }
  });
}



