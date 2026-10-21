import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/apiError.js';
import { requireFields } from '../utils/validators.js';
import {
  createLookRequest,
  listLookRequests,
  setLookRequestStatus,
} from '../repositories/lookRequest.repository.js';

export const LOOK_REQUEST_STATUSES = ['New', 'In Review', 'Fulfilled', 'Declined'];

const MAX_TEXT = 2000;
const MAX_IMAGE_CHARS = 6_000_000; // ~6 MB data URL

/** POST /api/chatbot/look-request — customer sends a generated look to the boutique. */
export const submitLookRequest = asyncHandler(async (req, res) => {
  requireFields(req.body, ['prompt']);

  const imageData = String(req.body.image || '');
  if (imageData && !imageData.startsWith('data:image/')) {
    throw badRequest('Invalid image data.');
  }
  if (imageData.length > MAX_IMAGE_CHARS) {
    throw badRequest('That image is too large to send. Please generate a new look.');
  }

  const trim = (value, max = MAX_TEXT) => {
    const text = String(value || '').trim();
    return text ? text.slice(0, max) : null;
  };

  const requestId = await createLookRequest({
    userId: req.user.userId,
    prompt: trim(req.body.prompt),
    imageData: imageData || null,
    imageSource: trim(req.body.source, 120),
    sizing: trim(req.body.sizing, 120),
    measurements: trim(req.body.measurements),
    notes: trim(req.body.notes),
  });

  res.status(201).json({
    message: 'Your request has been sent to the boutique. We will reach out shortly.',
    requestId,
  });
});

/** GET /api/admin/look-requests — admin list of customer look requests. */
export const listRequests = asyncHandler(async (req, res) => {
  const rows = await listLookRequests(req.query.status);
  res.json({ requests: rows });
});

/** PUT /api/admin/look-requests/:id/status — update the request status. */
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  requireFields(req.body, ['status']);
  if (!LOOK_REQUEST_STATUSES.includes(status)) {
    throw badRequest(`Status must be one of: ${LOOK_REQUEST_STATUSES.join(', ')}.`);
  }
  if (!(await setLookRequestStatus(id, status))) throw notFound('Request not found.');
  res.json({ message: `Request #${id} marked as ${status}.` });
});
