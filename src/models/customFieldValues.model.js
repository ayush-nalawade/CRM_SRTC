const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

async function upsertValues(organization_id, entity_id, kv) {
	const now = dayjs().toDate();
	const entries = Object.entries(kv || {});
	for (const [definition_id, value] of entries) {
		await run(
			`INSERT INTO custom_field_values (organization_id, entity_id, definition_id, value, updated_at) VALUES (?, ?, ?, ?, ?)`,
			[organization_id, entity_id, definition_id, value, now]
		);
	}
	return true;
}

async function listValues(organization_id, entity_id) {
	const result = await run(
		`SELECT definition_id, value, updated_at FROM custom_field_values WHERE organization_id = ? AND entity_id = ?`,
		[organization_id, entity_id]
	);
	const map = {};
	for (const row of result.rows || []) {
		map[row.definition_id] = row.value;
	}
	return map;
}

module.exports = { upsertValues, listValues };


