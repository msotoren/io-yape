import http from 'node:http';
import { buildServer } from '@/infrastructure/http/server';
import { startIssuerMessaging } from '@/infrastructure/kafka';
import { metricsRegistry } from '@/infrastructure/observability/metrics';
import { initTracing } from '@/infrastructure/observability/tracing';

async function bootstrap(): Promise<void> {
  await initTracing('card-issuer');
  const app = await buildServer();
  await startIssuerMessaging();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: '0.0.0.0' });

  const metricsPort = Number(process.env.METRICS_PORT ?? 9091);
  const metricsServer = http.createServer(async (_req, res) => {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });
  metricsServer.listen(metricsPort, '0.0.0.0');
}

void bootstrap();

