const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

const leadColumns = [
	'organization_id',
	'id',
	'first_name',
	'last_name',
	'email',
	'phone',
	'company',
	'stage_id',
	'status',
	'assigned_to',
	'owner_id',
	'source',
	'title',
	'created_at',
	'updated_at',
];

async function insertLead({ organization_id, first_name = null, last_name = null, email = null, phone = null, company = null, stage_id = null, status = null, assigned_to = null, owner_id = null, source = null, title = null }) {
	const id = uuidv4();
	const now = dayjs().toDate();
	const query = `INSERT INTO leads (
		organization_id, id, first_name, last_name, email, phone, company, stage_id, status, assigned_to, owner_id, source, title, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	const params = [organization_id, id, first_name, last_name, email, phone, company, stage_id, status, assigned_to, owner_id, source, title, now, now];
	await run(query, params);

	// Denormalized tables (include created_at for clustering)
	if (assigned_to) {
		await run(`INSERT INTO leads_by_assigned (organization_id, assigned_to, created_at, id) VALUES (?, ?, ?, ?)`, [organization_id, assigned_to, now, id]);
	}
	if (stage_id) {
		await run(`INSERT INTO leads_by_stage (organization_id, stage_id, id) VALUES (?, ?, ?)`, [organization_id, stage_id, id]);
	}
	if (status) {
		await run(`INSERT INTO leads_by_status (organization_id, status, created_at, id) VALUES (?, ?, ?, ?)`, [organization_id, status, now, id]);
	}

	return { organization_id, id, first_name, last_name, email, phone, company, stage_id, status, assigned_to, owner_id, source, title, created_at: now, updated_at: now };
}

async function getLeadById(organization_id, id) {
	const query = `SELECT ${leadColumns.join(', ')} FROM leads WHERE organization_id = ? AND id = ? LIMIT 1`;
	const result = await run(query, [organization_id, id]);
	return result && result.rowLength > 0 ? result.first() : null;
}

async function updateLead(organization_id, id, patch) {
	const existing = await getLeadById(organization_id, id);
	if (!existing) return null;
	const allowed = ['first_name', 'last_name', 'email', 'phone', 'company', 'stage_id', 'status', 'assigned_to', 'owner_id', 'source', 'title'];
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
	const query = `UPDATE leads SET ${setParts.join(', ')} WHERE organization_id = ? AND id = ?`;
	params.push(organization_id, id);
	await run(query, params);

	// Maintain denormalized indexes when relevant columns change
	const newAssigned = Object.prototype.hasOwnProperty.call(patch, 'assigned_to') ? patch.assigned_to : existing.assigned_to;
	const newStage = Object.prototype.hasOwnProperty.call(patch, 'stage_id') ? patch.stage_id : existing.stage_id;
	const newStatus = Object.prototype.hasOwnProperty.call(patch, 'status') ? patch.status : existing.status;

	if (existing.assigned_to && existing.assigned_to !== newAssigned) {
		await run(`DELETE FROM leads_by_assigned WHERE organization_id = ? AND assigned_to = ? AND created_at = ? AND id = ?`, [organization_id, existing.assigned_to, existing.created_at, id]);
	}
	if (existing.stage_id && existing.stage_id !== newStage) {
		await run(`DELETE FROM leads_by_stage WHERE organization_id = ? AND stage_id = ? AND id = ?`, [organization_id, existing.stage_id, id]);
	}
	if (existing.status && existing.status !== newStatus) {
		await run(`DELETE FROM leads_by_status WHERE organization_id = ? AND status = ? AND created_at = ? AND id = ?`, [organization_id, existing.status, existing.created_at, id]);
	}

	if (newAssigned && newAssigned !== existing.assigned_to) {
		await run(`INSERT INTO leads_by_assigned (organization_id, assigned_to, created_at, id) VALUES (?, ?, ?, ?)`, [organization_id, newAssigned, existing.created_at, id]);
	}
	if (newStage && newStage !== existing.stage_id) {
		await run(`INSERT INTO leads_by_stage (organization_id, stage_id, id) VALUES (?, ?, ?)`, [organization_id, newStage, id]);
	}
	if (newStatus && newStatus !== existing.status) {
		await run(`INSERT INTO leads_by_status (organization_id, status, created_at, id) VALUES (?, ?, ?, ?)`, [organization_id, newStatus, existing.created_at, id]);
	}

	return getLeadById(organization_id, id);
}

async function deleteLead(organization_id, id) {
	const existing = await getLeadById(organization_id, id);
	const query = `DELETE FROM leads WHERE organization_id = ? AND id = ?`;
	await run(query, [organization_id, id]);
	if (existing) {
		if (existing.assigned_to) {
			await run(`DELETE FROM leads_by_assigned WHERE organization_id = ? AND assigned_to = ? AND created_at = ? AND id = ?`, [organization_id, existing.assigned_to, existing.created_at, id]);
		}
		if (existing.stage_id) {
			await run(`DELETE FROM leads_by_stage WHERE organization_id = ? AND stage_id = ? AND id = ?`, [organization_id, existing.stage_id, id]);
		}
		if (existing.status) {
			await run(`DELETE FROM leads_by_status WHERE organization_id = ? AND status = ? AND created_at = ? AND id = ?`, [organization_id, existing.status, existing.created_at, id]);
		}
	}
	return true;
}

async function listLeadsByOrg(organization_id, { stage_id, status, assigned_to, limit = 20, pageState, q }) {
	const options = { fetchSize: limit };
	if (pageState) options.pageState = pageState;

	let baseResult;
	let baseRows;
	if (assigned_to) {
		baseResult = await run(`SELECT id FROM leads_by_assigned WHERE organization_id = ? AND assigned_to = ?`, [organization_id, assigned_to], options);
		baseRows = baseResult.rows || [];
	} else if (stage_id) {
		baseResult = await run(`SELECT id FROM leads_by_stage WHERE organization_id = ? AND stage_id = ?`, [organization_id, stage_id], options);
		baseRows = baseResult.rows || [];
	} else if (status) {
		baseResult = await run(`SELECT id FROM leads_by_status WHERE organization_id = ? AND status = ?`, [organization_id, status], options);
		baseRows = baseResult.rows || [];
	} else {
		baseResult = await run(`SELECT id FROM leads WHERE organization_id = ?`, [organization_id], options);
		baseRows = baseResult.rows || [];
	}

	// Load full rows for the page ids
	const ids = baseRows.map((r) => r.id);
	const items = [];
	for (const id of ids) {
		const row = await getLeadById(organization_id, id);
		if (row) items.push(row);
	}

	let filtered = items;
	if (assigned_to) filtered = filtered.filter((r) => r.assigned_to === assigned_to);
	if (stage_id) filtered = filtered.filter((r) => r.stage_id === stage_id);
	if (status) filtered = filtered.filter((r) => r.status === status);
	if (q) {
		const needle = String(q).toLowerCase();
		filtered = filtered.filter((r) => {
			const first = (r.first_name || '').toLowerCase();
			const last = (r.last_name || '').toLowerCase();
			const emailVal = (r.email || '').toLowerCase();
			return first.startsWith(needle) || last.startsWith(needle) || emailVal.startsWith(needle);
		});
	}

	return { items: filtered, pageState: baseResult.pageState || null };
}

module.exports = {
	insertLead,
	getLeadById,
	updateLead,
	deleteLead,
	listLeadsByOrg,
};


