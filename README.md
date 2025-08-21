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

### Cassandra schema (leads)

```sql
-- Primary leads table
CREATE TABLE IF NOT EXISTS leads (
  organization_id text,
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  stage_id uuid,
  status text,
  assigned_to uuid,
  owner_id uuid,
  source text,
  title text,
  created_at timestamp,
  updated_at timestamp,
  PRIMARY KEY ((organization_id), id)
);

-- Denormalized index tables
CREATE TABLE IF NOT EXISTS leads_by_assigned (
  organization_id text,
  assigned_to uuid,
  id uuid,
  PRIMARY KEY ((organization_id), assigned_to, id)
);

CREATE TABLE IF NOT EXISTS leads_by_stage (
  organization_id text,
  stage_id uuid,
  id uuid,
  PRIMARY KEY ((organization_id), stage_id, id)
);

CREATE TABLE IF NOT EXISTS leads_by_status (
  organization_id text,
  status text,
  id uuid,
  PRIMARY KEY ((organization_id), status, id)
);
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

### Auth examples

Register:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org_123",
    "email": "alice@example.com",
    "password": "strongpassword",
    "first_name": "Alice",
    "last_name": "Doe",
    "role": "admin"
  }'
```

Login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org_123",
    "email": "alice@example.com",
    "password": "strongpassword"
  }'
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

### Cassandra schema (users)

Example CQL for user tables. Adjust types/names to your standards.

```sql
-- Primary table partitioned by organization, clustered by user id
CREATE TABLE IF NOT EXISTS users (
  organization_id text,
  id uuid,
  email text,
  password_hash text,
  first_name text,
  last_name text,
  role text,
  created_at timestamp,
  updated_at timestamp,
  PRIMARY KEY ((organization_id), id)
);

-- Lookup table to fetch by email within an org, avoids ALLOW FILTERING
CREATE TABLE IF NOT EXISTS users_by_email (
  organization_id text,
  email text,
  id uuid,
  PRIMARY KEY ((organization_id), email)
);
```


