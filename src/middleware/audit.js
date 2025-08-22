const { insertAudit } = require('../models/audit.model');

function pickDetails(body) {
	if (!body || typeof body !== 'object') return null;
	const shallow = { ...body };
	if (shallow.password) delete shallow.password;
	if (shallow.token) delete shallow.token;
	return shallow;
}

function audit(entity_type, action) {
	return function auditMiddleware(req, res, next) {
		const start = Date.now();
		const originalJson = res.json.bind(res);
		const originalSend = res.send.bind(res);

		async function writeAuditIfOk(payload) {
			try {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					const organization_id = req.auth && req.auth.organizationId;
					const user_id = req.auth && req.auth.userId;
					const ip = req.ip || (req.headers['x-forwarded-for'] || '').toString().split(',')[0] || req.connection?.remoteAddress || null;
					const user_agent = req.headers['user-agent'] || null;
					// Best-effort entity_id: from params.id or response payload
					let entity_id = req.params && (req.params.id || req.params.userId || req.params.leadId);
					if (!entity_id && payload && typeof payload === 'object') {
						const candidate = payload.lead || payload.user || payload.definition || payload.stage;
						if (candidate && candidate.id) entity_id = candidate.id;
					}
					await insertAudit({
						organization_id,
						user_id,
						entity_type,
						entity_id: entity_id || null,
						action,
						details: pickDetails(req.body),
						ip,
						user_agent,
					});
				}
			} catch (e) {
				// Do not break responses if audit fails
			}
		}

		res.json = function (body) {
			writeAuditIfOk(body);
			return originalJson(body);
		};

		res.send = function (body) {
			writeAuditIfOk();
			return originalSend(body);
		};

		next();
	};
}

module.exports = { audit };
