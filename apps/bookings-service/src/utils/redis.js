const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

const publisher = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  lazyConnect: true,
});

publisher.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

publisher.on('connect', () => {
  logger.info('Connected to Redis');
});

async function publishEvent(channel, data) {
  try {
    const message = JSON.stringify(data);
    await publisher.publish(channel, message);
    logger.info('Event published to Redis', { channel });
  } catch (err) {
    logger.error('Failed to publish event to Redis', { channel, error: err.message });
  }
}

module.exports = { publisher, publishEvent };
