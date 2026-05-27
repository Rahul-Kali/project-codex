import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://opspulse:opspulse@localhost:5432/opspulse',
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000
});

export async function query(text, params) {
  const started = performance.now();
  try {
    const result = await pool.query(text, params);
    return result;
  } finally {
    const duration = performance.now() - started;
    globalThis.__dbQueryObserver?.(duration);
  }
}

