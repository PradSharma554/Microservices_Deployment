const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { register: metricsRegister, httpRequestDuration, httpRequestTotal } = require('./metrics');
const eventsRouter = require('./routes/events');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());

// Metrics middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    end({ method: req.method, route, status_code: res.statusCode });
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

app.use('/api/events', eventsRouter);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.get('/ready', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  if (dbState === 1) {
    return res.status(200).json({ status: 'ready', db: 'connected' });
  }
  return res.status(503).json({ status: 'not ready', db: 'disconnected' });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', metricsRegister.contentType);
  res.end(await metricsRegister.metrics());
});

app.use(errorHandler);

async function start() {
  await mongoose.connect(config.mongoUri);
  logger.info('Connected to MongoDB');

  app.listen(config.port, () => {
    logger.info(`Events Service running on port ${config.port}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start Events Service', err);
  process.exit(1);
});

module.exports = app;
