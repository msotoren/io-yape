import { randomUUID } from 'node:crypto';

import { IssueCardCommand } from '@/application/commands/IssueCard.command';
import { CardRequest } from '@/domain/card/CardRequest';
import { CardStatus } from '@/domain/card/CardStatus';
import { CardRequestRepository } from '@/domain/repositories/CardRequestRepository';
import { ConflictError } from '@/shared/errors/ConflictError';
import { ErrorCode } from '@/shared/errors/ErrorCode';

export class IssueCardService {
  constructor(private readonly repository: CardRequestRepository) {}

  async execute(command: IssueCardCommand): Promise<{ requestId: string; status: CardStatus }> {
    const existing = await this.repository.findActiveByDocumentNumber(command.customer.documentNumber);

    if (existing) {
      throw new ConflictError(
        ErrorCode.CUSTOMER_ALREADY_HAS_CARD,
        `Customer ${command.customer.documentNumber} already has an active card request.`,
        { existingRequestId: existing.requestId }
      );
    }

    const requestId = randomUUID();
    const cardRequest = CardRequest.create({ requestId, ...command });
    await this.repository.saveWithOutbox(cardRequest);

    return { requestId, status: CardStatus.PENDING };
  }
}

