import express from 'express';
import cors from 'cors';
import { PORT } from './config/env';
import { connectDatabase } from './database/connection';
import { mcpRouter } from './routes/mcp.routes';
import { logger } from './utils/logger';

const app = express();

// ---------------------------
// Middleware
// ---------------------------
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// ---------------------------
// Routes
// ---------------------------
app.use('/mcp', mcpRouter);

// ---------------------------
// Health Check
// ---------------------------
app.get('/health', (req, res) => {
  const now = new Date().toLocaleString('en-IL', { 
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  res.status(200).json({ status: 'ok', timestamp: now });
});

// ---------------------------
// Error Handler
// ---------------------------
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled middleware error', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: err.message,
  });
});

// ---------------------------
// Start Server
// ---------------------------
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info('Server started', { port: PORT, url: `http://localhost:${PORT}` });
    });
  } catch (error) {
    logger.error(
      'Failed to start server',
      error instanceof Error ? error : new Error(String(error))
    );
    process.exit(1);
  }
}

startServer();
