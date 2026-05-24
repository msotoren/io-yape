import { ConsecutiveBreaker, ExponentialBackoff, circuitBreaker, handleAll, retry, wrap } from 'cockatiel';

import { CardStatus } from '@/domain/card/CardStatus';
import { ProcessCardIssuanceService } from '@/application/services/ProcessCardIssuanceService';
import { DLQProducer } from '@/infrastructure/kafka/producers/DLQProducer';
import { ProcessingEventProducer } from '@/infrastructure/kafka/producers/ProcessingEventProducer';

const MAX_RETRIES = 3;

export type RetryIssuanceContext = {
  event: {
    requestId: string;
    customer: { documentNumber: string };
    forceError: boolean;
    sourceEvent: unknown;
  };
  processor: ProcessCardIssuanceService;
  dlqProducer: DLQProducer;
  processingProducer: ProcessingEventProducer;
  onIssued: (input: {
    requestId: string;
    attempts: number;
    card: { id: string; maskedNumber: string; expiryDate: string; cvvHash: string };
    processingTimeMs: number;
  }) => Promise<void>;
};

export async function processWithRetry(context: RetryIssuanceContext): Promise<{ outcome: 'issued' | 'failed_dlq'; retries: number }> {
  const { event, processor, dlqProducer, processingProducer, onIssued } = context;
  const baseDelayMs = process.env.NODE_ENV === 'test' ? 10 : 1000;
  const retryPolicy = retry(handleAll, {
    maxAttempts: MAX_RETRIES,
    backoff: new ExponentialBackoff({ initialDelay: baseDelayMs, maxDelay: baseDelayMs * 4 })
  });

  const breakerPolicy = circuitBreaker(handleAll, {
    breaker: new ConsecutiveBreaker(3),
    halfOpenAfter: 5000
  });

  const resiliencePolicy = wrap(retryPolicy, breakerPolicy);

  const errors: Array<{ attempt: number; message: string; at: string }> = [];
  let attempt = 0;

  try {
    const result = await resiliencePolicy.execute(async () => {
      attempt += 1;

      await processingProducer.publish(
        { requestId: event.requestId, status: CardStatus.PROCESSING, attempt, error: {} },
        event.customer.documentNumber
      );

      return processor.process({ requestId: event.requestId, customer: event.customer, forceError: event.forceError, attempt });
    });

    await onIssued({
      requestId: event.requestId,
      attempts: attempt,
      card: result.card,
      processingTimeMs: result.ms
    });

    return { outcome: 'issued', retries: Math.max(0, attempt - 1) };
  } catch (err) {
    const error = err as Error;
    errors.push({ attempt: Math.max(1, attempt), message: error.message, at: new Date().toISOString() });
  }

  await dlqProducer.publish(
    {
      requestId: event.requestId,
      status: CardStatus.FAILED,
      originalEvent: event.sourceEvent,
      error: {
        reason: `Max retries (${MAX_RETRIES}) exceeded`,
        attempts: Math.max(attempt, MAX_RETRIES),
        errors,
        deadLetteredAt: new Date().toISOString()
      }
    },
    event.customer.documentNumber
  );

  return { outcome: 'failed_dlq', retries: Math.max(attempt, MAX_RETRIES) };
}


