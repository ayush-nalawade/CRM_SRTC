const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

async function createUser({ organization_id, email, password_hash, first_name = null, last_name = null, role = 'user' }) {
	const id = uuidv4();
	const now = dayjs().toDate();
	const query = `INSERT INTO users (
		organization_id, id, email, password_hash, first_name, last_name, role, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	const params = [organization_id, id, email, password_hash, first_name, last_name, role, now, now];
	await run(query, params);
	return { organization_id, id, email, password_hash, first_name, last_name, role, created_at: now, updated_at: now };
}

async function getUserByEmail(organization_id, email) {
	const query = `SELECT organization_id, id, email, password_hash, first_name, last_name, role, created_at, updated_at
		FROM users WHERE organization_id = ? AND email = ? LIMIT 1`;
	const params = [organization_id, email];
	const result = await run(query, params);
	return result && result.rowLength > 0 ? result.first() : null;
}

async function getUserById(organization_id, id) {
	const query = `SELECT organization_id, id, email, password_hash, first_name, last_name, role, created_at, updated_at
		FROM users WHERE organization_id = ? AND id = ? LIMIT 1`;
	const params = [organization_id, id];
	const result = await run(query, params);
	return result && result.rowLength > 0 ? result.first() : null;
}

module.exports = {
	createUser,
	getUserByEmail,
	getUserById,
};


