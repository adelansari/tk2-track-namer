import { Pool } from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// must have DATABASE_URL in .env.local
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL – set it in your .env.local');
}

// decode CA cert from base64
const caCert = Buffer.from(process.env.DATABASE_CA_CERT_BASE64!, 'base64')
                      .toString('utf8');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true,
    ca: caCert,
  },
});


// sanity‐check on import
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('DB connection error:', err.message);
  else console.log('DB connected @', res.rows[0].now);
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