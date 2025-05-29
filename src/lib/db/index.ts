import { Pool } from 'pg';

// must have DATABASE_URL in .env.local
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL – set it in your .env.local');
}

const getCertificate = () => {
  if (process.env.DATABASE_CA_CERT_BASE64) {
    return Buffer.from(process.env.DATABASE_CA_CERT_BASE64, 'base64').toString('ascii');
  }
  // Fall back to the regular cert
  return process.env.DATABASE_CA_CERT;
};

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true,
    ca: getCertificate(),
  },
});

// Add pool error handling to prevent unhandled rejections
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO tk2namechanger_besidehorn');
    const start = Date.now();
    const res = await client.query(text, params);
    console.log('Executed query', {
      text,
      duration: Date.now() - start,
      rows: res.rowCount,
    });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  } finally {
    client.release();
  }
};