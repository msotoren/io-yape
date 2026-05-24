export type IssueCardCommand = {
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

