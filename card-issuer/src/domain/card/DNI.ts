import { ValidationError } from '@/shared/errors/ValidationError';

export class DNI {
  readonly value: string;

  constructor(value: string) {
    if (!/^\d{8}$/.test(value)) {
      throw new ValidationError('documentNumber must be a numeric DNI with 8 digits');
    }
    
    this.value = value;
  }
}

