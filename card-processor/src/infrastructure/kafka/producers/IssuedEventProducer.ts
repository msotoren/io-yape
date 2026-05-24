import { EventTopic } from '@/domain/events/EventTopic';
import { processorKafka } from '../kafka.client';

export class IssuedEventProducer {
  private readonly producer = processorKafka.producer();

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async publish(payload: unknown, key: string): Promise<void> {
    const event = {
      id: `${Date.now()}`,
      source: 'card-processor',
      specversion: '1.0',
      type: EventTopic.CARD_ISSUED,
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: payload
    };

    await this.producer.send({
      topic: EventTopic.CARD_ISSUED,
      messages: [{ key, value: JSON.stringify(event) }]
    });
  }
}


