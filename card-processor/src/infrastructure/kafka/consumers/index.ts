import { ProcessCardIssuanceService } from '@/application/services/ProcessCardIssuanceService';
import { startCardRequestedConsumer } from '@/infrastructure/kafka/consumers/CardRequestedConsumer';
import { DLQProducer } from '@/infrastructure/kafka/producers/DLQProducer';
import { IssuedEventProducer } from '@/infrastructure/kafka/producers/IssuedEventProducer';
import { ProcessingEventProducer } from '@/infrastructure/kafka/producers/ProcessingEventProducer';

export async function startProcessorConsumers(input: {
  processor: ProcessCardIssuanceService;
  issuedProducer: IssuedEventProducer;
  processingProducer: ProcessingEventProducer;
  dlqProducer: DLQProducer;
}): Promise<void> {
  await startCardRequestedConsumer(input.processor, input.issuedProducer, input.processingProducer, input.dlqProducer);
}

