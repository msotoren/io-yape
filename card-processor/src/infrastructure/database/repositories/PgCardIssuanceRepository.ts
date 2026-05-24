import { CardIssuanceRepository } from '@/domain/repositories/CardIssuanceRepository';
import { processorPool } from '../pg.client';

export class PgCardIssuanceRepository implements CardIssuanceRepository {

  async saveIssuedCard(input: {
    requestId: string;
    documentNumber: string;
    cardNumber: string;
    maskedNumber: string;
    expiryDate: string;
    cvvHash: string;
    attempts: number;
    processingTimeMs: number;
  }): Promise<void> {
    await processorPool.query(
      `INSERT INTO card_issuances
        (request_id, document_number, card_number, masked_number, expiry_date, cvv_hash, attempts, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.requestId,
        input.documentNumber,
        input.cardNumber,
        input.maskedNumber,
        input.expiryDate,
        input.cvvHash,
        input.attempts,
        input.processingTimeMs
      ]
    );
  }
}


