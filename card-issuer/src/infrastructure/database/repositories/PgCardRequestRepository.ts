import { CardRequest } from '@/domain/card/CardRequest';
import { CardStatus } from '@/domain/card/CardStatus';
import { EventTopic } from '@/domain/events/EventTopic';
import {
  ActiveCard,
  CardStatusView,
  CardRequestRepository
} from '@/domain/repositories/CardRequestRepository';
import { OutboxSignal } from '@/infrastructure/kafka/outbox/OutboxSignal';
import { outboxEmitter } from '@/infrastructure/kafka/outbox/outbox.emitter';
import { issuerPool } from '../pg.client';

export class PgCardRequestRepository implements CardRequestRepository {
  async findActiveByDocumentNumber(documentNumber: string): Promise<ActiveCard | null> {
    const result = await issuerPool.query(
      `SELECT request_id, status
       FROM card_requests
       WHERE document_number = $1
       AND status IN ('pendiente', 'en_proceso', 'emitido')
       LIMIT 1`,
      [documentNumber]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return {
      requestId: result.rows[0].request_id,
      status: result.rows[0].status
    };
  }

  async saveWithOutbox(request: CardRequest): Promise<void> {
    const client = await issuerPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO card_requests
          (request_id, document_number, document_type, full_name, birth_date, email, card_type, currency, status, force_error)
           VALUES ($1, $2, $3, $4, to_date($5, 'DD/MM/YYYY'), $6, $7, $8, $9, $10)`,
        [
          request.requestId,
          request.documentNumber,
          request.documentType,
          request.fullName,
          request.birthDate,
          request.email,
          request.cardType,
          request.currency,
          CardStatus.PENDING,
          request.forceError
        ]
      );

      await client.query(
        `INSERT INTO outbox_events
          (aggregate_id, event_type, topic, partition_key, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [
          request.requestId,
          EventTopic.CARD_REQUESTED,
          EventTopic.CARD_REQUESTED,
          request.documentNumber,
          JSON.stringify({
            requestId: request.requestId,
            customer: {
              documentType: request.documentType,
              documentNumber: request.documentNumber,
              fullName: request.fullName,
              birthDate: request.birthDate,
              email: request.email
            },
            product: { type: request.cardType, currency: request.currency },
            forceError: request.forceError,
            status: CardStatus.PENDING,
            error: {}
          })
        ]
      );

      await client.query('COMMIT');
      outboxEmitter.emit(OutboxSignal.NEW_EVENT);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStatusByRequestId(requestId: string): Promise<CardStatusView | null> {
    const result = await issuerPool.query(
      `SELECT request_id, status, attempts, failure_reason, card_id, card_masked_number, card_expiry_date,
              card_issued_at, document_number, full_name, card_type, currency, created_at, updated_at
       FROM card_requests
       WHERE request_id = $1`,
      [requestId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      requestId: row.request_id,
      status: row.status,
      attempts: row.attempts,
      failureReason: row.failure_reason,
      card: row.card_id
        ? {
            id: row.card_id,
            maskedNumber: row.card_masked_number,
            expiryDate: row.card_expiry_date,
            issuedAt: row.card_issued_at
          }
        : null,
      customer: { documentNumber: row.document_number, fullName: row.full_name },
      product: { type: row.card_type, currency: row.currency },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async markAsProcessing(requestId: string, attempts: number): Promise<void> {
    await issuerPool.query(
      `UPDATE card_requests
       SET status=$1, attempts=$2, updated_at=NOW()
       WHERE request_id=$3 AND status IN ('pendiente', 'en_proceso')`,
      [CardStatus.PROCESSING, attempts, requestId]
    );
  }

  async markAsIssued(input: {
    requestId: string;
    attempts: number;
    card: { id: string; maskedNumber: string; expiryDate: string; issuedAt: string };
  }): Promise<void> {
    await issuerPool.query(
      `UPDATE card_requests
       SET status=$1, attempts=$2, card_id=$3, card_masked_number=$4, card_expiry_date=$5,
           card_issued_at=$6, updated_at=NOW()
       WHERE request_id=$7 AND status IN ('pendiente', 'en_proceso')`,
      [
        CardStatus.ISSUED,
        input.attempts,
        input.card.id,
        input.card.maskedNumber,
        input.card.expiryDate,
        input.card.issuedAt,
        input.requestId
      ]
    );
  }

  async markAsFailed(input: { requestId: string; attempts: number; reason: string }): Promise<number> {
    const result = await issuerPool.query(
      `UPDATE card_requests
       SET status=$1, failure_reason=$2, attempts=$3, updated_at=NOW()
       WHERE request_id=$4 AND status IN ('pendiente', 'en_proceso')`,
      [CardStatus.FAILED, input.reason, input.attempts, input.requestId]
    );
    return result.rowCount ?? 0;
  }

  async getPendingOutbox(
    limit: number
  ): Promise<Array<{ id: number; topic: string; partitionKey: string; payload: unknown }>> {
    const result = await issuerPool.query(
      `SELECT id, topic, partition_key, payload
       FROM outbox_events
       WHERE published = FALSE
       ORDER BY id ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      partitionKey: row.partition_key,
      payload: row.payload
    }));
  }

  async markOutboxAsPublished(id: number): Promise<void> {
    await issuerPool.query(
      `UPDATE outbox_events
       SET published = TRUE, published_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }
}


