import { CardNumber } from '@/domain/card/CardNumber';

describe('CardNumber Value Object', () => {
  it('generates a 16-digit number starting with 4', () => {
    const { full, masked } = CardNumber.generate();
    expect(full).toHaveLength(16);
    expect(full.startsWith('4')).toBe(true);
  });

  it('generates a masked number in format 4xxx **** **** xxxx', () => {
    const { masked } = CardNumber.generate();
    expect(masked).toMatch(/^4\d{3} \*{4} \*{4} \d{4}$/);
  });
});

