import { CardType } from '@/domain/card/CardType';
import { ValidationError } from '@/shared/errors/ValidationError';

describe('CardType Value Object', () => {
  it('rejects MASTERCARD', () => {
    expect(() => new CardType('MASTERCARD')).toThrow(ValidationError);
  });

  it('rejects AMEX', () => {
    expect(() => new CardType('AMEX')).toThrow(ValidationError);
  });

  it('accepts VISA', () => {
    expect(() => new CardType('VISA')).not.toThrow();
    expect(new CardType('VISA').value).toBe('VISA');
  });
});

