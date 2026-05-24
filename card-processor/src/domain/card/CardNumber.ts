import { randomInt } from 'node:crypto';

export class CardNumber {
  static generate(): { full: string; masked: string } {
    const last4 = String(randomInt(1000, 9999));
    const full = `4532${String(randomInt(100000000, 999999999))}${last4}`.slice(0, 16);
    const masked = `${full.slice(0, 4)} **** **** ${full.slice(12, 16)}`;
    return { full, masked };
  }
}

