import { execute, withTransaction } from './database.repository.js';

export const findUserById = async (userId) => {
  const [rows] = await execute('SELECT * FROM users WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

export const findProfileByUserId = async (userId) => {
  const [rows] = await execute('SELECT * FROM customer_profiles WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

export const isEmailUsedByAnotherUser = async (email, userId) => {
  const [rows] = await execute(
    'SELECT user_id FROM users WHERE email = ? AND user_id <> ?',
    [email, userId]
  );
  return rows.length > 0;
};

export const updateCustomerProfile = (userId, fields) =>
  withTransaction(async (connection) => {
    await connection.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE user_id = ?',
      [fields.name, fields.email, userId]
    );
    await connection.query(
      `INSERT INTO customer_profiles (user_id, height_cm, measurements, preferred_style, preferred_color, preferred_fit)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         height_cm = VALUES(height_cm),
         measurements = VALUES(measurements),
         preferred_style = VALUES(preferred_style),
         preferred_color = VALUES(preferred_color),
         preferred_fit = VALUES(preferred_fit)`,
      [
        userId,
        fields.heightCm,
        fields.measurements,
        fields.preferredStyle,
        fields.preferredColor,
        fields.preferredFit,
      ]
    );
  });

export const updatePassword = (userId, passwordHash) =>
  execute('UPDATE users SET password = ? WHERE user_id = ?', [passwordHash, userId]);
