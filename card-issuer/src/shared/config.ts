export const config = {
  port: Number(process.env.PORT ?? 3000),
  metricsPort: Number(process.env.METRICS_PORT ?? 9091),
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  pg: {
    host: process.env.PG_HOST ?? 'localhost',
    port: Number(process.env.PG_PORT ?? 5432),
    database: process.env.PG_DB ?? 'issuer_db',
    user: process.env.PG_USER ?? 'issuer',
    password: process.env.PG_PASSWORD ?? 'changeme'
  }
};

