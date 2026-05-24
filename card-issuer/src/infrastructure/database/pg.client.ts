import { Pool } from 'pg';

export const issuerPool = new Pool({
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  database: process.env.PG_DB ?? 'issuer_db',
  user: process.env.PG_USER ?? 'issuer',
  password: process.env.PG_PASSWORD ?? 'changeme'
});

