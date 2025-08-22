const express = require('express');
const authRoutes = require('./auth.routes');
const leadsRoutes = require('./leads.routes');
const customFieldsRoutes = require('./custom-fields.routes');
const leadCustomFieldsRoutes = require('./lead-custom-fields.routes');
const stagesRoutes = require('./stages.routes');
const journeyRoutes = require('./journey.routes');

const router = express.Router();

router.get('/v1/ping', (req, res) => {
	res.json({ success: true, message: 'pong' });
});

router.use('/auth', authRoutes);
router.use('/', leadsRoutes);
router.use('/', customFieldsRoutes);
router.use('/', leadCustomFieldsRoutes);
router.use('/', stagesRoutes);
router.use('/', journeyRoutes);

module.exports = router;


