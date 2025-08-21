const pino = require('pino');

const isDev = (process.env.NODE_ENV || 'development') === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      }
    : undefined,
  base: undefined,
});

module.exports = logger;


