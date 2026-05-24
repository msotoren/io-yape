export class ExpiryDate {
  static generate(): string {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() + 3);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${month}/${year}`;
  }
}

