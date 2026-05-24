import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

export class CVV {
  static async generateHash(): Promise<string> {
    const cvv = String(randomInt(100, 999));
    return bcrypt.hash(cvv, 10);
  }
}

