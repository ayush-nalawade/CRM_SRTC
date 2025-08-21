const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const createError = require('http-errors');
const { run } = require('../config/cassandra');

async function createUser({ organization_id, email, password_hash, first_name = null, last_name = null, role = 'user' }) {
	const id = uuidv4();
	const now = dayjs().toDate();

	// Reserve email for this organization using LWT to enforce uniqueness
	const reserveEmailQuery = `INSERT INTO users_by_email (organization_id, email, id) VALUES (?, ?, ?) IF NOT EXISTS`;
	const reserve = await run(reserveEmailQuery, [organization_id, email, id]);
	if (!reserve.wasApplied()) {
		throw createError(409, 'Email already registered for this organization', { code: 'EMAIL_EXISTS' });
	}

	// Insert into primary users table
	const insertUserQuery = `INSERT INTO users (
		organization_id, id, email, password_hash, first_name, last_name, role, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	const insertUserParams = [organization_id, id, email, password_hash, first_name, last_name, role, now, now];
	await run(insertUserQuery, insertUserParams);

	return { organization_id, id, email, password_hash, first_name, last_name, role, created_at: now, updated_at: now };
}

async function getUserByEmail(organization_id, email) {
	// Lookup user id from users_by_email to avoid ALLOW FILTERING
	const lookupQuery = `SELECT id FROM users_by_email WHERE organization_id = ? AND email = ? LIMIT 1`;
	const lookup = await run(lookupQuery, [organization_id, email]);
	if (!lookup || lookup.rowLength === 0) return null;
	const { id } = lookup.first();
	return getUserById(organization_id, id);
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


