const { z } = require('zod');
const { register, login } = require('../services/auth.service');

const registerSchema = z.object({
	organization_id: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(8),
	first_name: z.string().min(1).optional(),
	last_name: z.string().min(1).optional(),
	role: z.string().min(1).optional(),
});

const loginSchema = z.object({
	organization_id: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(8),
});

async function handleRegister(req, res, next) {
	try {
		const data = registerSchema.parse(req.body);
		const result = await register(data);
		return res.status(201).json({ success: true, ...result });
	} catch (err) {
		return next(err);
	}
}

async function handleLogin(req, res, next) {
	try {
		const data = loginSchema.parse(req.body);
		const result = await login(data);
		return res.json({ success: true, ...result });
	} catch (err) {
		return next(err);
	}
}

module.exports = { handleRegister, handleLogin };


