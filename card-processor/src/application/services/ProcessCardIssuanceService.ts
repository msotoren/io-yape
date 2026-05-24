import { CardNumber } from '@/domain/card/CardNumber';
import { CVV } from '@/domain/card/CVV';
import { ExpiryDate } from '@/domain/card/ExpiryDate';
import { ExternalProcessor } from '@/domain/ports/ExternalProcessor';
import { CardIssuanceRepository } from '@/domain/repositories/CardIssuanceRepository';

export class ProcessCardIssuanceService {
  constructor(
    private readonly repository: CardIssuanceRepository,
    private readonly externalProcessor: ExternalProcessor
  ) {}

  async process(event: {
    requestId: string;
    customer: { documentNumber: string };
    forceError: boolean;
    attempt: number;
  }): Promise<{ card: { id: string; maskedNumber: string; expiryDate: string; cvvHash: string }; ms: number }> {
    const start = Date.now();
    await this.externalProcessor.process(event.forceError);

    const card = CardNumber.generate();
    const cvvHash = await CVV.generateHash();
    const expiryDate = ExpiryDate.generate();

    await this.repository.saveIssuedCard({
      requestId: event.requestId,
      documentNumber: event.customer.documentNumber,
      cardNumber: card.full,
      maskedNumber: card.masked,
      expiryDate,
      cvvHash,
      attempts: event.attempt,
      processingTimeMs: Date.now() - start
    });

    return {
      card: { id: `card_${event.requestId}`, maskedNumber: card.masked, expiryDate, cvvHash },
      ms: Date.now() - start
    };
  }
}



