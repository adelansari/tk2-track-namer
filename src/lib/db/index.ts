import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: 'postgresql://tk2namechanger_besidehorn:6ce7d63be8c1e2696f66c8e7fb852b358a7f8461@xt9wl.h.filess.io:5433/tk2namechanger_besidehorn',
  ssl: false, // Disable SSL as the server doesn't support it
});

// Test the connection when the module is imported
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully:', res.rows[0].now);
    // Set search path to the user's schema
    pool.query('SET search_path TO tk2namechanger_besidehorn', (err) => {
      if (err) {
        console.error('Error setting search path:', err.message);
      } else {
        console.log('Search path set to tk2namechanger_besidehorn schema');
      }
    });
  }
});

// Export the pool for use in other modules
export default pool;

// Helper function for querying the database
// Always sets the schema search path before executing the query
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    // Always set the search path before executing any query
    await client.query('SET search_path TO tk2namechanger_besidehorn');
    
    const start = Date.now();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  } finally {
    client.release();
  }
};