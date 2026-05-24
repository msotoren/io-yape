import { EventPublisher } from '@/domain/ports/EventPublisher';
import { issuerKafka } from './kafka.client';

export class KafkaEventPublisher implements EventPublisher {
  private readonly producer = issuerKafka.producer();

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(topic: string, key: string, event: unknown): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(event) }]
    });
  }
}

