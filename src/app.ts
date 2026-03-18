import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { AppDataSource } from './config/database';
import { swaggerSpec } from './config/swagger';
import './config/passport';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { initCampaignStatusCron } from './jobs/campaign-status.cron';

const app = express();

// ── Vercel / Reverse Proxy Support ────────────────────────────────────────────
// Required for express-rate-limit when behind a proxy like Vercel
app.set('trust proxy', 1);


// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : '*';

app.use(
  cors({
    origin: clientUrl === '*' ? '*' : [clientUrl, `${clientUrl}/`],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Rate limiting ──────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SCharity API is running',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API docs ──────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('[Database] Connected successfully');
    }

    initCampaignStatusCron();

    if (!process.env.VERCEL) {
      const PORT = Number(process.env.PORT) || 3000;
      app.listen(PORT, () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
        console.log(`[Docs]   Swagger UI at http://localhost:${PORT}/api-docs`);
      });
    }
  } catch (err) {
    console.error('[Fatal] Failed to start server:', err);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// Start the email worker in the same process (can be split into separate process for production)
if (!process.env.VERCEL) {
  import('./queues/processors/email.processor');
}

bootstrap();

export default app;
