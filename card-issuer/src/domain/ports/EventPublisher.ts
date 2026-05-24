import { EventTopic } from '@/domain/events/EventTopic';

export interface EventPublisher {
  publish(topic: EventTopic | string, key: string, event: unknown): Promise<void>;
}

