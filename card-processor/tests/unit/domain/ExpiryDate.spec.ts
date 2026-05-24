import { ExpiryDate } from '@/domain/card/ExpiryDate';

describe('ExpiryDate Value Object', () => {
  it('generates a future expiry in MM/YY format', () => {
    const expiry = ExpiryDate.generate();
    expect(expiry).toMatch(/^\d{2}\/\d{2}$/);
  });

  it('is at least 1 year in the future', () => {
    const expiry = ExpiryDate.generate();
    const [month, year] = expiry.split('/').map(Number);
    const expiryDate = new Date(2000 + year, month - 1);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    expect(expiryDate.getTime()).toBeGreaterThanOrEqual(oneYearFromNow.getTime() - 1000 * 60 * 60 * 24 * 32);
  });
});

