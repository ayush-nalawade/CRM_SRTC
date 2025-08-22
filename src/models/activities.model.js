const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

async function insertActivity({ organization_id, lead_id, type, description, details = null, created_by }) {
	const id = uuidv4();
	const created_at = dayjs().toDate();
	const query = `INSERT INTO activities (
		organization_id, lead_id, created_at, id, type, description, details, created_by
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
	await run(query, [organization_id, lead_id, created_at, id, type, description, details, created_by]);
	return { organization_id, lead_id, created_at, id, type, description, details, created_by };
}

async function listActivities(organization_id, lead_id, { limit = 50, pageState } = {}) {
	const options = { fetchSize: limit };
	if (pageState) options.pageState = pageState;
	const query = `SELECT organization_id, lead_id, created_at, id, type, description, details, created_by
		FROM activities WHERE organization_id = ? AND lead_id = ?`;
	const result = await run(query, [organization_id, lead_id], options);
	return { items: result.rows || [], pageState: result.pageState || null };
}

module.exports = { insertActivity, listActivities };
