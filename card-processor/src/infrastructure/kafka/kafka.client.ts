import { Kafka } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

export const processorKafka = new Kafka({
  clientId: 'card-processor',
  brokers
});

