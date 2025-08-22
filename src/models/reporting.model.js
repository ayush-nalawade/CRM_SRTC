const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

async function upsertLeadByStage({ organization_id, stage_id, created_at, id }) {
	const query = `INSERT INTO leads_by_stage_rpt (organization_id, stage_id, created_at, id) VALUES (?, ?, ?, ?)`;
	await run(query, [organization_id, stage_id, created_at, id]);
}

async function deleteLeadByStage({ organization_id, stage_id, created_at, id }) {
	const query = `DELETE FROM leads_by_stage_rpt WHERE organization_id = ? AND stage_id = ? AND created_at = ? AND id = ?`;
	await run(query, [organization_id, stage_id, created_at, id]);
}

async function upsertLeadByOwner({ organization_id, owner_id, created_at, id }) {
	const query = `INSERT INTO leads_by_owner_rpt (organization_id, owner_id, created_at, id) VALUES (?, ?, ?, ?)`;
	await run(query, [organization_id, owner_id, created_at, id]);
}

async function deleteLeadByOwner({ organization_id, owner_id, created_at, id }) {
	const query = `DELETE FROM leads_by_owner_rpt WHERE organization_id = ? AND owner_id = ? AND created_at = ? AND id = ?`;
	await run(query, [organization_id, owner_id, created_at, id]);
}

async function insertJourneyByDay({ organization_id, yyyymmdd, changed_at, lead_id, id, to_stage_id }) {
	const rowId = id || uuidv4();
	const query = `INSERT INTO journeys_by_day (organization_id, yyyymmdd, changed_at, lead_id, id, to_stage_id) VALUES (?, ?, ?, ?, ?, ?)`;
	await run(query, [organization_id, yyyymmdd, changed_at, lead_id, rowId, to_stage_id]);
}

async function countLeadsByStagePartition(organization_id, stage_id) {
	const query = `SELECT COUNT(*) as count FROM leads_by_stage_rpt WHERE organization_id = ? AND stage_id = ?`;
	const result = await run(query, [organization_id, stage_id]);
	return Number(result.first().count || 0);
}

async function listOwnerIdsFromLeads(organization_id) {
	const query = `SELECT owner_id FROM leads WHERE organization_id = ?`;
	const result = await run(query, [organization_id]);
	return (result.rows || []).map((r) => r.owner_id).filter(Boolean);
}

async function countLeadsByOwnerPartition(organization_id, owner_id) {
	const query = `SELECT COUNT(*) as count FROM leads_by_owner_rpt WHERE organization_id = ? AND owner_id = ?`;
	const result = await run(query, [organization_id, owner_id]);
	return Number(result.first().count || 0);
}

async function listJourneysByDayRange(organization_id, from, to) {
	const start = dayjs(from).startOf('day');
	const end = dayjs(to).endOf('day');
	const days = [];
	let cur = start.clone();
	while (cur.isBefore(end) || cur.isSame(end)) {
		days.push(cur.format('YYYYMMDD'));
		cur = cur.add(1, 'day');
	}
	const all = [];
	for (const day of days) {
		const query = `SELECT to_stage_id FROM journeys_by_day WHERE organization_id = ? AND yyyymmdd = ?`;
		const res = await run(query, [organization_id, day]);
		for (const row of res.rows || []) all.push(row);
	}
	return all;
}

module.exports = {
	upsertLeadByStage,
	deleteLeadByStage,
	upsertLeadByOwner,
	deleteLeadByOwner,
	insertJourneyByDay,
	countLeadsByStagePartition,
	listOwnerIdsFromLeads,
	countLeadsByOwnerPartition,
	listJourneysByDayRange,
};
