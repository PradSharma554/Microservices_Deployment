const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bookings_db',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  eventsServiceUrl: process.env.EVENTS_SERVICE_URL || 'http://localhost:3001',
};

module.exports = config;
