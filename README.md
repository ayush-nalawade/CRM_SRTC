## Multi-tenant CRM Backend (Node.js + Express + Cassandra/ScyllaDB)

Production-ready Express server scaffold for a multi-tenant CRM backed by Cassandra/ScyllaDB.

### Features
- **Security and logging**: helmet, cors, morgan, pino
- **Database**: cassandra-driver with prepared statements helper
- **Errors**: centralized JSON handler `{ success:false, code, message, details }`
- **Auth**: JWT utilities and placeholder middleware
- **Testing**: Jest + Supertest

### Requirements
- Node.js 18+
- Cassandra or ScyllaDB cluster

### Environment
Create `.env` (see `.env.example`):

```
PORT=4000
NODE_ENV=development
CASSANDRA_CONTACT_POINTS=127.0.0.1
CASSANDRA_DATACENTER=datacenter1
CASSANDRA_KEYSPACE=crm
CASSANDRA_USERNAME=cassandra
CASSANDRA_PASSWORD=cassandra
JWT_SECRET=change_me_please
JWT_EXPIRES_IN=1d
```

### Install

```
npm install
```

### Development

```
npm run dev
```

Visit `http://localhost:4000/health` and `http://localhost:4000/api/v1/ping`.

### Production

```
npm start
```

### Testing

```
npm test
```

### Structure

```
src/
  app.js
  config/
    cassandra.js
    logger.js
  controllers/
  middleware/
    auth.js
    errorHandler.js
  models/
  routes/
    index.js
  services/
  utils/
    crypto.js
    jwt.js
index.js
```

Notes:
- `src/config/cassandra.js` exports `session`, `connectCassandra()`, and `run(query, params, options)`.
- `src/middleware/auth.js` reads Bearer token and sets `req.user`.


