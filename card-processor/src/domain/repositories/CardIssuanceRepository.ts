export interface CardIssuanceRepository {
  saveIssuedCard(input: {
    requestId: string;
    documentNumber: string;
    cardNumber: string;
    maskedNumber: string;
    expiryDate: string;
    cvvHash: string;
    attempts: number;
    processingTimeMs: number;
  }): Promise<void>;
}

