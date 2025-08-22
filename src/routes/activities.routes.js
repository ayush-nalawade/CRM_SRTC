const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { handleCreateActivity, handleListActivities } = require('../controllers/activities.controller');

const router = express.Router();

router.post('/leads/:id/activities', verifyJWT, requireRole('admin', 'manager', 'sales'), handleCreateActivity);
router.get('/leads/:id/activities', verifyJWT, requireRole('admin', 'manager', 'sales'), handleListActivities);

module.exports = router;
