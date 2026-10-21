import { execute } from './database.repository.js';

export const createLookRequest = async ({
  userId,
  prompt,
  imageData,
  imageSource,
  sizing,
  measurements,
  notes,
}) => {
  const [result] = await execute(
    `INSERT INTO look_requests
       (user_id, prompt, image_data, image_source, sizing, measurements, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, prompt, imageData, imageSource, sizing, measurements, notes]
  );
  return result.insertId;
};

export const listLookRequests = async (status) => {
  const where = status ? 'WHERE lr.status = ?' : '';
  const params = status ? [status] : [];
  const [rows] = await execute(
    `SELECT lr.request_id, lr.user_id, lr.prompt, lr.image_data, lr.image_source,
            lr.sizing, lr.measurements, lr.notes, lr.status, lr.created_at,
            u.name AS customer, u.email AS email
     FROM look_requests lr
     JOIN users u ON u.user_id = lr.user_id
     ${where}
     ORDER BY lr.created_at DESC`,
    params
  );
  return rows;
};

export const setLookRequestStatus = async (requestId, status) => {
  await execute('UPDATE look_requests SET status = ? WHERE request_id = ?', [status, requestId]);
  const [rows] = await execute('SELECT request_id FROM look_requests WHERE request_id = ?', [requestId]);
  return rows.length > 0;
};

export const countNewLookRequests = async () => {
  const [[{ total }]] = await execute(
    "SELECT COUNT(*) AS total FROM look_requests WHERE status = 'New'"
  );
  return Number(total) || 0;
};
