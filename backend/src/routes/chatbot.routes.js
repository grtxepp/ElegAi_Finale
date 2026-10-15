import { Router } from 'express';
import { sendMessage, generateImage } from '../controllers/chatbot.controller.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { aiLimiter, imageLimiter } from '../middleware/rateLimit.js';

const router = Router();

// POST /api/chatbot/message — conversational reply (optional sign-in for personalisation)
router.post('/message', aiLimiter, optionalAuth, sendMessage);

// POST /api/chatbot/generate-image — outfit visualisation (costs a provider call, so stricter)
router.post('/generate-image', imageLimiter, optionalAuth, generateImage);

export default router;