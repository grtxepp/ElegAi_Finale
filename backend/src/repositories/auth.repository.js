import { execute, withTransaction } from './database.repository.js';

export const findUserByEmail = async (email) => {
  const [rows] = await execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

export const findUserById = async (userId) => {
  const [rows] = await execute('SELECT * FROM users WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

export const findProfileByUserId = async (userId) => {
  const [rows] = await execute('SELECT * FROM customer_profiles WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

export const createCustomerAccount = ({ name, email, passwordHash }) =>
  withTransaction(async (connection) => {
    const [inserted] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'customer']
    );
    await connection.query('INSERT INTO customer_profiles (user_id) VALUES (?)', [inserted.insertId]);

    const [users] = await connection.query('SELECT * FROM users WHERE user_id = ?', [inserted.insertId]);
    const [profiles] = await connection.query(
      'SELECT * FROM customer_profiles WHERE user_id = ?',
      [inserted.insertId]
    );
    return { user: users[0], profile: profiles[0] || null };
  });

export const findUserIdByEmail = async (email) => {
  const [rows] = await execute('SELECT user_id FROM users WHERE email = ?', [email]);
  return rows[0]?.user_id || null;
};

export const createPasswordResetToken = (userId, tokenHash) =>
  execute(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR))',
    [userId, tokenHash]
  );

/** Set a password and consume its reset token atomically. */
export const consumePasswordResetToken = (tokenHash, passwordHash) =>
  withTransaction(async (connection) => {
    const [rows] = await connection.query(
      'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0 AND expires_at > UTC_TIMESTAMP() FOR UPDATE',
      [tokenHash]
    );
    const record = rows[0];
    if (!record) return null;

    await connection.query('UPDATE users SET password = ? WHERE user_id = ?', [passwordHash, record.user_id]);
    await connection.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [record.id]);
    return record;
  });
