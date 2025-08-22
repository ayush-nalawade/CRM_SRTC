const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

async function insertAudit({ organization_id, user_id, entity_type, entity_id, action, details = null, ip = null, user_agent = null }) {
	const id = uuidv4();
	const created_at = dayjs().toDate();
	const query = `INSERT INTO audit_logs (
		organization_id, created_at, id, user_id, entity_type, entity_id, action, details, ip, user_agent
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	await run(query, [organization_id, created_at, id, user_id, entity_type, entity_id, action, JSON.stringify(details || null), ip, user_agent]);
	return { organization_id, created_at, id, user_id, entity_type, entity_id, action, details, ip, user_agent };
}

async function listAudits(organization_id, { from, to, entity_type, limit = 50, pageState } = {}) {
	const options = { fetchSize: limit };
	if (pageState) options.pageState = pageState;
	let query = `SELECT organization_id, created_at, id, user_id, entity_type, entity_id, action, details, ip, user_agent
		FROM audit_logs WHERE organization_id = ?`;
	const params = [organization_id];
	if (from) { query += ' AND created_at >= ?'; params.push(new Date(from)); }
	if (to) { query += ' AND created_at <= ?'; params.push(new Date(to)); }
	const result = await run(query, params, options);
	let rows = result.rows || [];
	if (entity_type) {
		rows = rows.filter((r) => r.entity_type === entity_type);
	}
	return { items: rows, pageState: result.pageState || null };
}

module.exports = { insertAudit, listAudits };
