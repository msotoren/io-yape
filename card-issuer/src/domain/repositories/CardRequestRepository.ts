import { CardRequest } from '@/domain/card/CardRequest';

export type ActiveCard = {
  requestId: string;
  status: string;
};

export type CardStatusView = {
  requestId: string;
  status: string;
  attempts: number;
  failureReason: string | null;
  card: {
    id: string;
    maskedNumber: string;
    expiryDate: string;
    issuedAt: string;
  } | null;
  customer: { documentNumber: string; fullName: string };
  product: { type: string; currency: string };
  createdAt: string;
  updatedAt: string;
};

export interface CardRequestRepository {
  findActiveByDocumentNumber(documentNumber: string): Promise<ActiveCard | null>;
  saveWithOutbox(request: CardRequest): Promise<void>;
  getStatusByRequestId(requestId: string): Promise<CardStatusView | null>;
  markAsProcessing(requestId: string, attempts: number): Promise<void>;
  markAsIssued(input: {
    requestId: string;
    attempts: number;
    card: { id: string; maskedNumber: string; expiryDate: string; issuedAt: string };
  }): Promise<void>;
  markAsFailed(input: { requestId: string; attempts: number; reason: string }): Promise<number>;
  getPendingOutbox(limit: number): Promise<Array<{ id: number; topic: string; partitionKey: string; payload: unknown }>>;
  markOutboxAsPublished(id: number): Promise<void>;
}

