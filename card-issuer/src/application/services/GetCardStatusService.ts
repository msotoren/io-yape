import { CardRequestRepository } from '@/domain/repositories/CardRequestRepository';
import { GetCardStatusQuery } from '@/application/queries/GetCardStatus.query';
import { NotFoundError } from '@/shared/errors/NotFoundError';

export class GetCardStatusService {
  constructor(private readonly repository: CardRequestRepository) {}

  async execute(query: GetCardStatusQuery) {
    const status = await this.repository.getStatusByRequestId(query.requestId);
    if (!status) {
      throw new NotFoundError('Card request not found');
    }

    return status;
  }
}

