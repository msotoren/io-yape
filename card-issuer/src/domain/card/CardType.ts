import { ValidationError } from '@/shared/errors/ValidationError';

export class CardType {
  readonly value: 'VISA';

  constructor(value: string) {
    if (value !== 'VISA') {
      throw new ValidationError('Only VISA is supported');
    }
    this.value = 'VISA';
  }
}

