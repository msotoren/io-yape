import { DNI } from '@/domain/card/DNI';
import { ValidationError } from '@/shared/errors/ValidationError';

describe('DNI Value Object', () => {
  it('rejects less than 8 digits', () => {
    expect(() => new DNI('1234567')).toThrow(ValidationError);
  });

  it('rejects non-numeric', () => {
    expect(() => new DNI('1234567A')).toThrow(ValidationError);
  });

  it('accepts valid DNI', () => {
    expect(() => new DNI('12345678')).not.toThrow();
  });
});

