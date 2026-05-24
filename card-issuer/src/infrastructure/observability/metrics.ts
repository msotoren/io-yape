import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const metrics = {
  httpRequestDuration: new Histogram({
    name: 'card_issuer_http_duration_ms',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [metricsRegistry]
  }),
  cardIssuanceRequestedTotal: new Counter({
    name: 'card_issuer_requests_total',
    help: 'Total card issuance requests',
    labelNames: ['status'] as const,
    registers: [metricsRegistry]
  }),
  outboxPendingEvents: new Gauge({
    name: 'card_issuer_outbox_pending_events',
    help: 'Outbox events pending publication to Kafka',
    registers: [metricsRegistry]
  })
};

