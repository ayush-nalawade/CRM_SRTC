const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

async function insertJourneyEntry({ organization_id, lead_id, from_stage_id, to_stage_id, changed_by, notes = null }) {
	const now = dayjs().toDate();
	const query = `INSERT INTO lead_journey (
		organization_id, lead_id, transition_id, from_stage_id, to_stage_id, changed_by, notes, changed_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
	const transition_id = `${lead_id}_${now.getTime()}`;
	const params = [organization_id, lead_id, transition_id, from_stage_id, to_stage_id, changed_by, notes, now];
	await run(query, params);
	return { organization_id, lead_id, transition_id, from_stage_id, to_stage_id, changed_by, notes, changed_at: now };
}

async function listJourneyByLead(organization_id, lead_id, limit = 50) {
	const query = `SELECT organization_id, lead_id, transition_id, from_stage_id, to_stage_id, changed_by, notes, changed_at
		FROM lead_journey WHERE organization_id = ? AND lead_id = ? ORDER BY changed_at DESC LIMIT ?`;
	const result = await run(query, [organization_id, lead_id, limit]);
	return result.rows || [];
}

module.exports = {
	insertJourneyEntry,
	listJourneyByLead,
};
