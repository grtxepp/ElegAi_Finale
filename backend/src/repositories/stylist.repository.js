import { execute } from './database.repository.js';

export const findCustomerStyleProfile = async (userId) => {
  const [rows] = await execute('SELECT * FROM customer_profiles WHERE user_id = ?', [userId]);
  return rows[0] || null;
};
