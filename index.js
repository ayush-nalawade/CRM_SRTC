require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const logger = require('./src/config/logger');
const { connectCassandra, shutdownCassandra } = require('./src/config/cassandra');

const PORT = parseInt(process.env.PORT || '4000', 10);

async function start() {
  try {
    await connectCassandra();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to Cassandra');
    process.exit(1);
  }

  const server = http.createServer(app);
  server.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, `Server listening on port ${PORT}`);
  });

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    server.close(async () => {
      await shutdownCassandra();
      process.exit(0);
    });
  });
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    server.close(async () => {
      await shutdownCassandra();
      process.exit(0);
    });
  });
}

start();


