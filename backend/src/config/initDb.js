import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { DB } from './env.js';
import { pool, TLS } from './db.js';
import { seedSampleOrders } from './seedOrders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQL_DIR = path.resolve(__dirname, '../../sql');
const SSL = TLS;

/**
 * Idempotent database bootstrap:
 *  1. Create the database if it does not exist.
 *  2. Apply schema.sql (CREATE TABLE IF NOT EXISTS …).
 *  3. Seed products / demo users if the tables are empty.
 *  4. Insert a handful of sample orders so the admin dashboard has data.
 */
export async function initDatabase() {
  // 1. Ensure the database exists (connect without a default database).
  const bootstrap = await mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    multipleStatements: true,
    ssl: SSL,
  });
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  // 2–4. Schema + seed on a connection that allows multiple statements.
  const conn = await mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    database: DB.database,
    multipleStatements: true,
    ssl: SSL,
  });

  const schema = await fs.readFile(path.join(SQL_DIR, 'schema.sql'), 'utf8');
  await conn.query(schema);

  const [[{ productCount }]] = await conn.query('SELECT COUNT(*) AS productCount FROM products');
  if (productCount === 0) {
    const seed = await fs.readFile(path.join(SQL_DIR, 'seed.sql'), 'utf8');
    await conn.query(seed);
    console.log('[db] Seeded catalog + demo users.');
  }

  const [[{ orderCount }]] = await conn.query('SELECT COUNT(*) AS orderCount FROM orders');
  if (orderCount === 0) {
    await seedSampleOrders(conn);
    console.log('[db] Seeded sample orders for the admin dashboard.');
  }

  await conn.end();
  console.log(`[db] Connected to MySQL at ${DB.host}:${DB.port}/${DB.database}`);
}

/** Small helper used by server.js to shut down cleanly. */
export async function closePool() {
  await pool.end();
}
