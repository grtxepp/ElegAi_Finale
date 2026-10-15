import { Router } from 'express';
import { recommend } from '../controllers/stylist.controller.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { uploadMemory } from '../middleware/upload.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public endpoint (optional auth) — multipart so a photo can be attached.
router.post('/recommend', aiLimiter, optionalAuth, uploadMemory.single('photo'), recommend);

export default router;
