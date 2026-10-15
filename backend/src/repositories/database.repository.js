import { pool, query } from '../config/db.js';

/**
 * Persistence adapter used by feature repositories. Controllers/services should
 * not import mysql2 or write SQL directly; keep database work behind this layer.
 */
export const execute = query;

/** Run a sequence of repository operations atomically. */
export const withTransaction = async (work) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
