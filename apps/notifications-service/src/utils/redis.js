const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

const subscriber = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  protocol: 2, // ioredis v6 defaults to RESP3; keep the v5 wire protocol
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

subscriber.on('connect', () => {
  logger.info('Redis subscriber connected');
});

subscriber.on('error', (err) => {
  logger.error('Redis subscriber error', { error: err.message });
});

subscriber.subscribe('booking.confirmed', 'booking.cancelled', (err) => {
  if (err) {
    logger.error('Failed to subscribe to Redis channels', { error: err.message });
  } else {
    logger.info('Subscribed to booking.confirmed and booking.cancelled channels');
  }
});

module.exports = subscriber;
