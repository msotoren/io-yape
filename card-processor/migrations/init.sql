CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE card_issuances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE,
  document_number VARCHAR(8) NOT NULL,
  card_number VARCHAR(19) NOT NULL,
  masked_number VARCHAR(19) NOT NULL,
  expiry_date VARCHAR(5) NOT NULL,
  cvv_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'emitido',
  processing_time_ms INTEGER,
  attempts INTEGER DEFAULT 1,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE INDEX idx_card_issuances_document ON card_issuances(document_number);
CREATE INDEX idx_card_issuances_request ON card_issuances(request_id);

