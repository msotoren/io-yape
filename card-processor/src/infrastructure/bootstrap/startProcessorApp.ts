import http from 'node:http';

import { ProcessCardIssuanceService } from '@/application/services/ProcessCardIssuanceService';
import { PgCardIssuanceRepository } from '@/infrastructure/database/repositories/PgCardIssuanceRepository';
import { ExternalProcessorClient } from '@/infrastructure/external/ExternalProcessorClient';
import { startProcessorConsumers } from '@/infrastructure/kafka/consumers';
import { DLQProducer } from '@/infrastructure/kafka/producers/DLQProducer';
import { IssuedEventProducer } from '@/infrastructure/kafka/producers/IssuedEventProducer';
import { ProcessingEventProducer } from '@/infrastructure/kafka/producers/ProcessingEventProducer';
import { processorMetricsRegistry } from '@/infrastructure/observability/metrics';
import { initTracing } from '@/infrastructure/observability/tracing';

export async function startProcessorApp(): Promise<void> {
  await initTracing('card-processor');
  const repository = new PgCardIssuanceRepository();
  const processor = new ProcessCardIssuanceService(repository, new ExternalProcessorClient());
  const issuedProducer = new IssuedEventProducer();
  const processingProducer = new ProcessingEventProducer();
  const dlqProducer = new DLQProducer();

  await Promise.all([issuedProducer.connect(), processingProducer.connect(), dlqProducer.connect()]);

  await startProcessorConsumers({
    processor,
    issuedProducer,
    processingProducer,
    dlqProducer
  });

  const metricsPort = Number(process.env.METRICS_PORT ?? 9093);
  const metricsServer = http.createServer(async (_req, res) => {
    res.setHeader('Content-Type', processorMetricsRegistry.contentType);
    res.end(await processorMetricsRegistry.metrics());
  });
  metricsServer.listen(metricsPort, '0.0.0.0');
}


