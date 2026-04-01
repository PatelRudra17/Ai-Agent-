const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(authMiddleware);
router.use(roleGuard('admin', 'manager'));

router.get('/tasks', analyticsController.getTaskStats);
router.get('/calls', analyticsController.getCallStats);
router.get('/team', analyticsController.getTeamStats);
router.get('/employee/:userId', analyticsController.getEmployeeStats);
router.get('/morning-briefing', analyticsController.getMorningBriefing);

module.exports = router;
