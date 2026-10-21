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

// The single administrator account. Customers register their own accounts.
const ADMIN_NAME = 'ElegaiAdmin';
const ADMIN_EMAIL = 'elegaiadmin@elegai.com';
// bcrypt hash of "Admin@123x"
const ADMIN_PASSWORD_HASH = '$2a$10$AdI6PeOa/soaeZdOHa4Dp.2DDfSdzCLYpy5QB/7YrozJz9fGlnBsa';

/** Remove legacy demo accounts and guarantee exactly one administrator. */
async function ensureSingleAdmin(conn) {
  await conn.query(
    `DELETE FROM users WHERE email IN
       ('admin@elegai.com','maria@example.com','juan@example.com','ana@example.com')`
  );
  await conn.query("DELETE FROM users WHERE role = 'admin' AND email <> ?", [ADMIN_EMAIL]);
  await conn.query(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), role = 'admin'`,
    [ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD_HASH]
  );
}

/** Add columns introduced after the first release to existing databases. */
async function ensureLookRequestColumns(conn) {
  const [columns] = await conn.query('SHOW COLUMNS FROM look_requests');
  const names = new Set(columns.map((column) => column.Field));
  if (!names.has('admin_note')) {
    await conn.query('ALTER TABLE look_requests ADD COLUMN admin_note TEXT NULL AFTER status');
  }
  if (!names.has('updated_at')) {
    await conn.query(
      'ALTER TABLE look_requests ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
    );
  }
}

/** Add profile columns introduced after the first release to existing databases. */
async function ensureProfileColumns(conn) {
  const [columns] = await conn.query('SHOW COLUMNS FROM customer_profiles');
  const names = new Set(columns.map((column) => column.Field));
  if (!names.has('preferred_size')) {
    await conn.query(
      'ALTER TABLE customer_profiles ADD COLUMN preferred_size VARCHAR(20) NULL AFTER preferred_fit'
    );
  }
}

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
  const isFreshDatabase = productCount === 0;
  if (isFreshDatabase) {
    const seed = await fs.readFile(path.join(SQL_DIR, 'seed.sql'), 'utf8');
    await conn.query(seed);
    console.log('[db] Seeded catalog + admin account.');
  }

  await ensureLookRequestColumns(conn);
  await ensureProfileColumns(conn);
  await ensureSingleAdmin(conn);

  // Only seed sample orders on a brand-new database. Never attach demo orders
  // to real customer accounts on an existing database.
  if (isFreshDatabase) {
    const [[{ orderCount }]] = await conn.query('SELECT COUNT(*) AS orderCount FROM orders');
    if (orderCount === 0) {
      await seedSampleOrders(conn);
      console.log('[db] Seeded sample orders for the admin dashboard.');
    }
  }

  await conn.end();
  console.log(`[db] Connected to MySQL at ${DB.host}:${DB.port}/${DB.database}`);
}

/** Small helper used by server.js to shut down cleanly. */
export async function closePool() {
  await pool.end();
}
