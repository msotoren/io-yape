import type { FastifyInstance } from 'fastify';

import { issuerPool } from '@/infrastructure/database/pg.client';
import { redisClient } from '@/infrastructure/cache/redis.client';
import { issuerKafka } from '@/infrastructure/kafka/kafka.client';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    let db = 'ok';
    let kafka = 'ok';
    let redis = 'ok';

    try {
      await issuerPool.query('SELECT 1');
    } catch {
      db = 'fail';
    }

    try {
      const admin = issuerKafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
    } catch {
      kafka = 'fail';
    }

    try {
      await redisClient.ping();
    } catch {
      redis = 'fail';
    }

    if (db === 'ok' && kafka === 'ok' && redis === 'ok') {
      return { status: 'ok', uptime: process.uptime(), checks: { db, kafka, redis } };
    }

    return reply.status(503).send({ status: 'fail', uptime: process.uptime(), checks: { db, kafka, redis } });
  });
}

