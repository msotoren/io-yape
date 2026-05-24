import { DomainError } from '@/shared/errors/DomainError';

export class BirthDate {
  readonly value: string;

  constructor(value: string) {
    const [day, month, year] = value.split('/').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (Number.isNaN(parsed.getTime())) {
      throw new DomainError('Invalid birthDate format, expected DD/MM/YYYY');
    }

    const age = BirthDate.calculateAge(parsed);
    if (age < 18) {
      throw new DomainError('Customer age must be >= 18');
    }

    this.value = value;
  }

  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
      age--;
    }

    return age;
  }
}

