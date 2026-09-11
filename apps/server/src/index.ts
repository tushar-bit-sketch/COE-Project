import http from 'http';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDatabase } from './database/prisma.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { SentinelWebSocketServer } from './websocket/server.js';
import { trackingService } from './services/tracking.service.js';

async function bootstrap() {
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('⚡ SENTINEL-X · Autonomous Surveillance Intelligence Server v5.0');
  console.log('─────────────────────────────────────────────────────────────────');

  // 1. Connect to Database
  await connectDatabase();

  // 2. Initialize Express
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health check at root
  app.get('/', (_req, res) => {
    res.json({
      name: 'SENTINEL-X Intelligence Server',
      version: '5.0.0',
      status: 'ONLINE',
      mode: 'TACTICAL_OPERATIONAL',
      apiPrefix: '/api/v1',
      wsEndpoint: '/ws',
    });
  });

  // Mount API V1
  app.use('/api/v1', apiRouter);

  // Error Handler
  app.use(errorHandler);

  // 3. Create HTTP & WebSocket Server
  const server = http.createServer(app);
  const wsServer = new SentinelWebSocketServer(server);

  // 4. Start Central Tracking & Simulation Loop (30 FPS = ~33ms)
  let loopRunning = true;
  const loopInterval = setInterval(async () => {
    if (!loopRunning) return;
    try {
      await trackingService.tick();
    } catch (e) {
      console.error('Error in main tracking loop tick:', e);
    }
  }, 33);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nTerminating SENTINEL-X server...');
    loopRunning = false;
    clearInterval(loopInterval);
    server.close(() => {
      console.log('Server terminated cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.listen(env.PORT, () => {
    console.log(`✓ HTTP API listening on http://localhost:${env.PORT}/api/v1`);
    console.log(`✓ WebSocket Server active at ws://localhost:${env.PORT}/ws`);
    console.log(`✓ Tracking loop running at 30 FPS`);
    console.log('─────────────────────────────────────────────────────────────────');
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
