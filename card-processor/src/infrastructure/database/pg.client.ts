import { Pool } from 'pg';

export const processorPool = new Pool({
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  database: process.env.PG_DB ?? 'processor_db',
  user: process.env.PG_USER ?? 'processor',
  password: process.env.PG_PASSWORD ?? 'changeme'
});

