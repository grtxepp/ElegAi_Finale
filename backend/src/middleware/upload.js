import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {
  UPLOAD_DIR,
  MAX_UPLOAD_MB,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXT,
} from '../config/env.js';
import { badRequest } from '../utils/apiError.js';

const uploadRoot = path.resolve(process.cwd(), UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype) || !ALLOWED_IMAGE_EXT.includes(ext)) {
    return cb(badRequest('Only JPG, PNG, WEBP or GIF images are allowed.'));
  }
  cb(null, true);
};

const limits = { fileSize: MAX_UPLOAD_MB * 1024 * 1024 };

/** Disk storage — used for product images (admin). */
export const uploadDisk = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, _file, cb) => {
      const ext = path.extname(_file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits,
  fileFilter,
});

/** Memory storage — used for the AI stylist photo (no persistence needed). */
export const uploadMemory = multer({ storage: multer.memoryStorage(), limits, fileFilter });
