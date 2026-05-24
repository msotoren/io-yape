import { CardStatus } from './CardStatus';
import { BirthDate } from './BirthDate';
import { CardType } from './CardType';
import { Currency } from './Currency';
import { DNI } from './DNI';
import { DomainError } from '@/shared/errors/DomainError';

type CreateCardRequestProps = {
  requestId: string;
  customer: {
    documentType: 'DNI';
    documentNumber: string;
    fullName: string;
    birthDate: string;
    email: string;
  };
  product: {
    type: 'VISA';
    currency: 'PEN' | 'USD';
  };
  forceError: boolean;
};

type IssuedCard = {
  id: string;
  maskedNumber: string;
  expiryDate: string;
  issuedAt: Date;
};

export class CardRequest {
  requestId: string;
  documentNumber: string;
  documentType: 'DNI';
  fullName: string;
  birthDate: string;
  email: string;
  cardType: 'VISA';
  currency: 'PEN' | 'USD';
  forceError: boolean;
  status: CardStatus;
  attempts: number;
  card: IssuedCard | null;
  failureReason: string | null;
  createdAt: Date;

  private constructor(props: CreateCardRequestProps) {
    this.requestId = props.requestId;
    this.documentType = props.customer.documentType;
    this.documentNumber = props.customer.documentNumber;
    this.fullName = props.customer.fullName;
    this.birthDate = props.customer.birthDate;
    this.email = props.customer.email;
    this.cardType = props.product.type;
    this.currency = props.product.currency;
    this.forceError = props.forceError;
    this.status = CardStatus.PENDING;
    this.attempts = 0;
    this.card = null;
    this.failureReason = null;
    this.createdAt = new Date();
  }

  static create(props: CreateCardRequestProps): CardRequest {
    if (props.customer.documentType !== 'DNI') {
      throw new DomainError('Only DNI is supported');
    }

    new DNI(props.customer.documentNumber);
    new BirthDate(props.customer.birthDate);
    new CardType(props.product.type);
    new Currency(props.product.currency);

    return new CardRequest(props);
  }

}

