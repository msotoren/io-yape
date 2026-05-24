import { IssueCardService } from '@/application/services/IssueCardService';
import { ConflictError } from '@/shared/errors/ConflictError';

const validCommand = {
  customer: {
    documentType: 'DNI' as const,
    documentNumber: '12345678',
    fullName: 'Jose Perez',
    birthDate: '02/03/2000',
    email: 'jose@example.com'
  },
  product: {
    type: 'VISA' as const,
    currency: 'PEN' as const
  },
  forceError: false
};

describe('IssueCardService', () => {
  it('generates requestId internally', async () => {
    const mockRepo = {
      findActiveByDocumentNumber: jest.fn().mockResolvedValue(null),
      saveWithOutbox: jest.fn()
    };
    const service = new IssueCardService(mockRepo as never);
    const result = await service.execute(validCommand);

    expect(result.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('returns conflict if active request exists', async () => {
    const mockRepo = {
      findActiveByDocumentNumber: jest.fn().mockResolvedValue({ requestId: 'existing-id', status: 'PENDING' }),
      saveWithOutbox: jest.fn()
    };
    const service = new IssueCardService(mockRepo as never);
    await expect(service.execute(validCommand)).rejects.toThrow(ConflictError);
  });
});

