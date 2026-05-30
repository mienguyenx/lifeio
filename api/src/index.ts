import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { authMiddleware } from './middleware/auth';
import tasksRouter from './routes/tasks';
import habitsRouter from './routes/habits';
import goalsRouter from './routes/goals';
import journalRouter from './routes/journal';
import dashboardRouter from './routes/dashboard';
import authRouter from './routes/auth';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Swagger docs
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LifeOS API',
      version: '1.0.0',
      description: 'REST API for LifeOS — manage tasks, habits, goals, and journal entries. Designed for AI agent integration.',
    },
    servers: [
      { url: process.env.API_BASE_URL || `http://localhost:${PORT}`, description: 'API Server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT access token',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key (prefix: lio_)',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LifeOS API Docs',
}));

app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/api/habits', authMiddleware, habitsRouter);
app.use('/api/goals', authMiddleware, goalsRouter);
app.use('/api/journal', authMiddleware, journalRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);
app.use('/api/auth', authMiddleware, authRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LifeOS API running on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
});

export default app;
