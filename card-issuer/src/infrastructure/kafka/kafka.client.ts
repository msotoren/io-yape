import { Kafka } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

export const issuerKafka = new Kafka({
  clientId: 'card-issuer',
  brokers
});

