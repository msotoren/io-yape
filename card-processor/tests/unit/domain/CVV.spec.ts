import { CVV } from '@/domain/card/CVV';

describe('CVV Value Object', () => {
  it('generates a bcrypt hash (not plain text)', async () => {
    const hash = await CVV.generateHash();
    expect(hash).toMatch(/^\$2[ab]\$\d+\$/);
  });

  it('generates different hashes each time', async () => {
    const h1 = await CVV.generateHash();
    const h2 = await CVV.generateHash();
    expect(h1).not.toBe(h2);
  });
});

