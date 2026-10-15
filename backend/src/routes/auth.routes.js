import { Router } from 'express';
import { getCaptchaConfig, register, login, me, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/captcha-config', getCaptchaConfig);
router.post('/register', registerLimiter, verifyCaptcha, register);
router.post('/login', loginLimiter, verifyCaptcha, login);
router.post('/forgot-password', passwordResetLimiter, verifyCaptcha, forgotPassword);
router.post('/reset-password', passwordResetLimiter, verifyCaptcha, resetPassword);
router.get('/me', authenticate, me);

export default router;
