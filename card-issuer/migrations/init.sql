CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE card_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number VARCHAR(8) NOT NULL,
  document_type VARCHAR(10) NOT NULL DEFAULT 'DNI',
  full_name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  email VARCHAR(255) NOT NULL,
  card_type VARCHAR(10) NOT NULL DEFAULT 'VISA',
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  card_id VARCHAR(50),
  card_masked_number VARCHAR(19),
  card_expiry_date VARCHAR(5),
  card_issued_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  failure_reason TEXT,
  force_error BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_card_requests_active_customer
  ON card_requests(document_number)
  WHERE status IN ('pendiente', 'en_proceso', 'emitido');

CREATE INDEX idx_card_requests_status ON card_requests(status);
CREATE INDEX idx_card_requests_document ON card_requests(document_number);

CREATE TABLE outbox_events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  partition_key VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbox_unpublished
  ON outbox_events(published, created_at)
  WHERE published = FALSE;

