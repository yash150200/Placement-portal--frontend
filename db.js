// db.js
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function testDb() {
  const res = await pool.query('SELECT NOW()');
  console.log('DB connected at:', res.rows[0].now);
}
