const createError = require('http-errors');
const { createUser, getUserByEmail } = require('../models/users.model');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { signToken } = require('../utils/jwt');

function sanitizeUser(user) {
	if (!user) return null;
	const { password_hash, ...rest } = user;
	return rest;
}

async function register(payload) {
	const { organization_id, email, password, first_name, last_name, role } = payload;
	const existing = await getUserByEmail(organization_id, email);
	if (existing) {
		throw createError(409, 'Email already registered for this organization', { code: 'EMAIL_EXISTS' });
	}
	const password_hash = await hashPassword(password);
	const user = await createUser({ organization_id, email, password_hash, first_name, last_name, role });
	const token = signToken({ sub: user.id, org: user.organization_id, role: user.role });
	return { token, user: sanitizeUser(user) };
}

async function login(payload) {
	const { organization_id, email, password } = payload;
	const user = await getUserByEmail(organization_id, email);
	if (!user) {
		throw createError(401, 'Invalid credentials', { code: 'INVALID_CREDENTIALS' });
	}
	const ok = await comparePassword(password, user.password_hash);
	if (!ok) {
		throw createError(401, 'Invalid credentials', { code: 'INVALID_CREDENTIALS' });
	}
	const token = signToken({ sub: user.id, org: user.organization_id, role: user.role });
	return { token, user: sanitizeUser(user) };
}

module.exports = { register, login };


