import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const processorMetricsRegistry = new Registry();
collectDefaultMetrics({ register: processorMetricsRegistry });

export const processorMetrics = {
  processingDuration: new Histogram({
    name: 'card_processor_processing_duration_ms',
    help: 'Card processing duration including retries',
    labelNames: ['outcome'] as const,
    buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
    registers: [processorMetricsRegistry]
  }),
  retryTotal: new Counter({
    name: 'card_processor_retry_total',
    help: 'Total retry attempts',
    labelNames: ['attempt_number'] as const,
    registers: [processorMetricsRegistry]
  }),
  dlqPublishedTotal: new Counter({
    name: 'card_processor_dlq_published_total',
    help: 'Total messages published to DLQ',
    labelNames: ['reason'] as const,
    registers: [processorMetricsRegistry]
  })
};

