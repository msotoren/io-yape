export const config = {
  metricsPort: Number(process.env.METRICS_PORT ?? 9093),
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  kafkaGroupId: process.env.KAFKA_GROUP_ID ?? 'card-processor-grp',
  pg: {
    host: process.env.PG_HOST ?? 'localhost',
    port: Number(process.env.PG_PORT ?? 5432),
    database: process.env.PG_DB ?? 'processor_db',
    user: process.env.PG_USER ?? 'processor',
    password: process.env.PG_PASSWORD ?? 'changeme'
  }
};

