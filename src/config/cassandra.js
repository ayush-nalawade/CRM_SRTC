const { Client } = require('cassandra-driver');
const logger = require('./logger');

const contactPoints = (process.env.CASSANDRA_CONTACT_POINTS || '127.0.0.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const client = new Client({
  contactPoints,
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || undefined,
  credentials: (process.env.CASSANDRA_USERNAME && process.env.CASSANDRA_PASSWORD)
    ? { username: process.env.CASSANDRA_USERNAME, password: process.env.CASSANDRA_PASSWORD }
    : undefined,
});

async function connectCassandra() {
  await client.connect();
  const keyspace = process.env.CASSANDRA_KEYSPACE;
  logger.info({ contactPoints, keyspace }, 'Connected to Cassandra/ScyllaDB');
}

async function run(query, params = [], options = {}) {
  const execOptions = { prepare: true, ...options };
  return client.execute(query, params, execOptions);
}

async function shutdownCassandra() {
  try {
    await client.shutdown();
    logger.info('Cassandra client shutdown complete');
  } catch (err) {
    logger.error({ err }, 'Error shutting down Cassandra client');
  }
}

module.exports = {
  session: client,
  connectCassandra,
  run,
  shutdownCassandra,
};


