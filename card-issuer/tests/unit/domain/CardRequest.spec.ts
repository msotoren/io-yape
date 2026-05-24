import { CardRequest } from '@/domain/card/CardRequest';
import { CardType } from '@/domain/card/CardType';
import { DNI } from '@/domain/card/DNI';
import { CardStatus } from '@/domain/card/CardStatus';
import { DomainError } from '@/shared/errors/DomainError';
import { ValidationError } from '@/shared/errors/ValidationError';

describe('DNI Value Object', () => {
  it('should reject DNI with less than 8 digits', () => {
    expect(() => new DNI('1234567')).toThrow(ValidationError);
  });

  it('should reject DNI with non-numeric chars', () => {
    expect(() => new DNI('1234567A')).toThrow(ValidationError);
  });

  it('should accept valid 8-digit DNI', () => {
    expect(() => new DNI('12345678')).not.toThrow();
  });
});

describe('CardType Value Object', () => {
  it('should reject MASTERCARD', () => {
    expect(() => new CardType('MASTERCARD')).toThrow(ValidationError);
  });

  it('should accept VISA', () => {
    expect(() => new CardType('VISA')).not.toThrow();
  });
});

describe('CardRequest Aggregate', () => {
  const validPayload = {
    requestId: '550e8400-e29b-41d4-a716-446655440000',
    customer: {
      documentType: 'DNI' as const,
      documentNumber: '12345678',
      fullName: 'Jose',
      birthDate: '02/03/2000',
      email: 'j@e.com'
    },
    product: { type: 'VISA' as const, currency: 'PEN' as const },
    forceError: false
  };

  it('should reject age below 18', () => {
    expect(() =>
      CardRequest.create({
        ...validPayload,
        customer: { ...validPayload.customer, birthDate: '02/03/2020' }
      })
    ).toThrow(DomainError);
  });

  it('should start with PENDING status', () => {
    const request = CardRequest.create(validPayload);
    expect(request.status).toBe(CardStatus.PENDING);
  });

  it('should keep creation defaults aligned with domain invariants', () => {
    const request = CardRequest.create(validPayload);
    expect(request.status).toBe(CardStatus.PENDING);
    expect(request.attempts).toBe(0);
    expect(request.card).toBeNull();
    expect(request.failureReason).toBeNull();
  });
});

