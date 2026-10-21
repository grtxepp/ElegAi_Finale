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
    const profileFields = [
      ['height_cm', fields.heightCm],
      ['measurements', fields.measurements],
      ['preferred_style', fields.preferredStyle],
      ['preferred_color', fields.preferredColor],
      ['preferred_fit', fields.preferredFit],
      ['preferred_size', fields.preferredSize],
    ].filter(([, value]) => value !== undefined);

    if (profileFields.length) {
      const columns = profileFields.map(([column]) => column).join(', ');
      const placeholders = profileFields.map(() => '?').join(', ');
      const updates = profileFields.map(([column]) => `${column} = VALUES(${column})`).join(', ');
      await connection.query(
        `INSERT INTO customer_profiles (user_id, ${columns})
         VALUES (?, ${placeholders})
         ON DUPLICATE KEY UPDATE ${updates}`,
        [userId, ...profileFields.map(([, value]) => value)]
      );
    }
  });

export const updatePassword = (userId, passwordHash) =>
  execute('UPDATE users SET password = ? WHERE user_id = ?', [passwordHash, userId]);
