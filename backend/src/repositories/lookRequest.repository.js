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
            lr.sizing, lr.measurements, lr.notes, lr.status, lr.admin_note,
            lr.created_at, lr.updated_at,
            u.name AS customer, u.email AS email
     FROM look_requests lr
     JOIN users u ON u.user_id = lr.user_id
     ${where}
     ORDER BY lr.created_at DESC`,
    params
  );
  return rows;
};

/** A customer's own requests, newest first. */
export const listUserLookRequests = async (userId) => {
  const [rows] = await execute(
    `SELECT request_id, prompt, image_data, image_source, sizing, measurements,
            notes, status, admin_note, created_at, updated_at
     FROM look_requests
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

/** Update status and/or the boutique's reply. Omitted fields stay unchanged. */
export const updateLookRequest = async (requestId, { status, adminNote } = {}) => {
  const fields = [];
  const params = [];
  if (status !== undefined) {
    fields.push('status = ?');
    params.push(status);
  }
  if (adminNote !== undefined) {
    fields.push('admin_note = ?');
    params.push(adminNote);
  }
  if (!fields.length) return false;

  params.push(requestId);
  await execute(`UPDATE look_requests SET ${fields.join(', ')} WHERE request_id = ?`, params);
  const [rows] = await execute('SELECT request_id FROM look_requests WHERE request_id = ?', [requestId]);
  return rows.length > 0;
};

export const countNewLookRequests = async () => {
  const [[{ total }]] = await execute(
    "SELECT COUNT(*) AS total FROM look_requests WHERE status = 'New'"
  );
  return Number(total) || 0;
};
