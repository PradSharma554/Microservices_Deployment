const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notifications_db',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
