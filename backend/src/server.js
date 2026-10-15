import app from './app.js';
import { PORT } from './config/env.js';
import { initDatabase } from './config/initDb.js';

/**
 * Start the HTTP server IMMEDIATELY so platform health checks (Back4app,
 * Render, Koyeb…) succeed right away, then initialize the database in the
 * background. On first boot, connecting to a cloud DB + seeding the catalog
 * can take 8-15s — we don't want the server to be "down" during that.
 */
function start() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[boot] ElegAI API listening on http://0.0.0.0:${PORT}`);
  });

  let attempts = 0;
  const MAX_ATTEMPTS = 8;

  async function bootstrap() {
    attempts += 1;
    try {
      await initDatabase();
      console.log('[boot] Database ready.');
    } catch (err) {
      console.error(`[boot] Database initialization failed (attempt ${attempts}):`, err.message);
      if (attempts < MAX_ATTEMPTS) {
        const delay = attempts * 5; // 5s, 10s, 15s…
        console.error(`[boot] Retrying in ${delay}s…`);
        setTimeout(bootstrap, delay * 1000);
      } else {
        console.error('[boot] Giving up on database init after 8 attempts. The API is up but DB-dependent endpoints will fail.');
      }
    }
  }

  bootstrap();

  // Graceful shutdown.
  const shutdown = () => {
    console.log('[boot] Shutting down…');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
