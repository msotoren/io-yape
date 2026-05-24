export const issueCardSchema = {
  headers: {
    type: 'object',
    required: ['x-idempotency-key'],
    properties: {
      'x-idempotency-key': { type: 'string', minLength: 1 }
    }
  },
  body: {
    type: 'object',
    required: ['customer', 'product', 'forceError'],
    properties: {
      customer: {
        type: 'object',
        required: ['documentType', 'documentNumber', 'fullName', 'birthDate', 'email'],
        properties: {
          documentType: { type: 'string', const: 'DNI' },
          documentNumber: { type: 'string', pattern: String.raw`^\d{8}$` },
          fullName: { type: 'string', minLength: 3 },
          birthDate: { type: 'string', pattern: String.raw`^\d{2}/\d{2}/\d{4}$` },
          email: { type: 'string', format: 'email' }
        }
      },
      product: {
        type: 'object',
        required: ['type', 'currency'],
        properties: {
          type: { type: 'string', const: 'VISA' },
          currency: { type: 'string', enum: ['PEN', 'USD'] }
        }
      },
      forceError: { type: 'boolean' }
    }
  }
} as const;

