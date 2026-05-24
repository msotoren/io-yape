import { ValidationError } from '@/shared/errors/ValidationError';

export class Currency {
  readonly value: 'PEN' | 'USD';

  constructor(value: string) {
    if (value !== 'PEN' && value !== 'USD') {
      throw new ValidationError('Currency must be PEN or USD');
    }
    this.value = value;
  }
}

