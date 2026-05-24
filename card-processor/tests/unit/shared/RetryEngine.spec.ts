import { processWithRetry } from '@/shared/retry/RetryEngine';

describe('RetryEngine', () => {
  it('retries 3 times before DLQ', async () => {
    const mockProcess = jest.fn().mockRejectedValue(new Error('External failure'));
    const mockDLQ = { publish: jest.fn().mockResolvedValue(undefined) };
    const mockProcessing = { publish: jest.fn().mockResolvedValue(undefined) };

    await processWithRetry({
      event: {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        customer: { documentNumber: '12345678' },
        forceError: true,
        sourceEvent: {}
      },
      processor: { process: mockProcess } as never,
      dlqProducer: mockDLQ as never,
      processingProducer: mockProcessing as never,
      onIssued: async () => {}
    });

    expect(mockProcess).toHaveBeenCalledTimes(3);
    expect(mockDLQ.publish).toHaveBeenCalledTimes(1);
  });

  it('succeeds on second attempt without hitting DLQ', async () => {
    const mockCard = {
      card: { id: 'card_1', maskedNumber: '4532 **** **** 1234', expiryDate: '12/28', cvvHash: '$2b$hash' },
      ms: 300
    };
    const mockProcess = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce(mockCard);
    const mockDLQ = { publish: jest.fn().mockResolvedValue(undefined) };
    const mockProcessing = { publish: jest.fn().mockResolvedValue(undefined) };
    const onIssued = jest.fn().mockResolvedValue(undefined);

    const result = await processWithRetry({
      event: {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        customer: { documentNumber: '12345678' },
        forceError: false,
        sourceEvent: {}
      },
      processor: { process: mockProcess } as never,
      dlqProducer: mockDLQ as never,
      processingProducer: mockProcessing as never,
      onIssued
    });

    expect(mockProcess).toHaveBeenCalledTimes(2);
    expect(mockDLQ.publish).not.toHaveBeenCalled();
    expect(onIssued).toHaveBeenCalledTimes(1);
    expect(result.outcome).toBe('issued');
  });
});


