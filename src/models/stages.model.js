const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

async function createStage({ organization_id, name, description = null, is_final = false, order = 0 }) {
	const id = uuidv4();
	const now = dayjs().toDate();
	const query = `INSERT INTO stages (
		organization_id, id, name, description, is_final, order, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
	const params = [organization_id, id, name, description, !!is_final, order, now, now];
	await run(query, params);
	return { organization_id, id, name, description, is_final: !!is_final, order, created_at: now, updated_at: now };
}

async function listStagesByOrg(organization_id) {
	const query = `SELECT organization_id, id, name, description, is_final, order, created_at, updated_at
		FROM stages WHERE organization_id = ? ORDER BY order ASC, created_at ASC`;
	const result = await run(query, [organization_id]);
	return result.rows || [];
}

async function getStageById(organization_id, id) {
	const query = `SELECT organization_id, id, name, description, is_final, order, created_at, updated_at
		FROM stages WHERE organization_id = ? AND id = ? LIMIT 1`;
	const result = await run(query, [organization_id, id]);
	return result && result.rowLength > 0 ? result.first() : null;
}

async function updateStage(organization_id, id, patch) {
	const allowed = ['name', 'description', 'is_final', 'order'];
	const setParts = [];
	const params = [];
	for (const key of allowed) {
		if (Object.prototype.hasOwnProperty.call(patch, key)) {
			setParts.push(`${key} = ?`);
			params.push(patch[key]);
		}
	}
	setParts.push('updated_at = ?');
	params.push(dayjs().toDate());
	const query = `UPDATE stages SET ${setParts.join(', ')} WHERE organization_id = ? AND id = ?`;
	params.push(organization_id, id);
	await run(query, params);
	return getStageById(organization_id, id);
}

async function deleteStage(organization_id, id) {
	// Check if stage is in use by any leads
	const leadsQuery = `SELECT COUNT(*) as count FROM leads WHERE organization_id = ? AND stage_id = ? LIMIT 1`;
	const leadsResult = await run(leadsQuery, [organization_id, id]);
	const leadCount = leadsResult.first()?.count || 0;
	
	if (leadCount > 0) {
		throw new Error('Cannot delete stage that has leads assigned to it');
	}
	
	// Check if stage is final
	const stage = await getStageById(organization_id, id);
	if (stage && stage.is_final) {
		throw new Error('Cannot delete final stage');
	}
	
	await run(`DELETE FROM stages WHERE organization_id = ? AND id = ?`, [organization_id, id]);
	return true;
}

module.exports = {
	createStage,
	listStagesByOrg,
	getStageById,
	updateStage,
	deleteStage,
};
