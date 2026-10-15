import mysql from 'mysql2/promise';
import { DB, DB_SSL } from './env.js';

/**
 * TiDB Serverless REQUIRES a secure (TLS) connection and refuses plain ones.
 * Auto-detect it so we never hit "insecure transport prohibited", even if the
 * DB_SSL env var is missing or misspelled on a host.
 */
export const needsTLS = DB_SSL || /tidbcloud|ticloud/i.test(DB.host) || Number(DB.port) === 4000;
export const TLS = needsTLS ? { rejectUnauthorized: false } : undefined;

/**
 * MySQL connection pool (mysql2). The frontend never touches this —
 * it only talks to the Express REST API.
 */
export const pool = mysql.createPool({
  host: DB.host,
  port: DB.port,
  user: DB.user,
  password: DB.password,
  database: DB.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,
  decimalNumbers: false,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // TiDB Serverless sometimes closes idle connections — this makes mysql2
  // silently recycle them instead of erroring with ECONNRESET.
  ssl: TLS,
});

/**
 * Query with a single automatic retry for transient connection errors
 * (ECONNRESET / PROTOCOL_CONNECTION_LOST) — common with serverless MySQL
 * like TiDB. The retry gets a fresh connection, so the app never shows
 * errors to the user for a blip.
 */
export const query = async (sql, params) => {
  try {
    const [rows] = await pool.query(sql, params);
    return [rows];
  } catch (err) {
    const transient = ['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT'].includes(err.code);
    if (transient) {
      const [rows] = await pool.query(sql, params);
      return [rows];
    }
    throw err;
  }
};

export const getConnection = () => pool.getConnection();

export default pool;
