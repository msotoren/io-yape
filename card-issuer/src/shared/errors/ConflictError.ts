export class ConflictError extends Error {
  code: string;
  metadata?: Record<string, string>;

  constructor(code: string, message: string, metadata?: Record<string, string>) {
    super(message);
    this.name = 'ConflictError';
    this.code = code;
    this.metadata = metadata;
  }
}

