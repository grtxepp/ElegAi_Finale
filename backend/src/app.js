import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CORS_ORIGIN, UPLOAD_DIR, AI_PROVIDER, SERVE_FRONTEND } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import stylistRoutes from './routes/stylist.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Security & parsing ──────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images via frontend
  })
);
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(apiLimiter);

// ── Static assets (served by the backend) ───────────────────────────
app.use('/uploads', express.static(path.resolve(process.cwd(), UPLOAD_DIR)));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// ── Health ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), aiProvider: AI_PROVIDER });
});

// ── REST API routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stylist', stylistRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ── Single-process mode: serve the built frontend (SPA fallback) ────
// Set SERVE_FRONTEND=true to run API + UI from one Node process
// (great for low-RAM machines). Build first: cd frontend && npm run build
if (SERVE_FRONTEND) {
  // The frontend/dist folder lives in different places depending on how
  // the app is run (local repo vs Docker container) — try every candidate.
  const candidates = [
    path.resolve(__dirname, '../../frontend/dist'), // local dev: <repo>/backend/src → <repo>/frontend/dist
    path.resolve(process.cwd(), 'frontend/dist'),   // container: cwd=/app → /app/frontend/dist
    '/app/frontend/dist',                            // container fallback
    path.resolve(__dirname, '../public'),            // last resort: bundled assets
  ];
  const distDir = candidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) || candidates[0];
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/|images\/|uploads\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
  console.log(`[boot] Serving built frontend from ${distDir}`);
}

// ── 404 + error handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
