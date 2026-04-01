const express = require('express');
const hrController = require('../controllers/hr.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(authMiddleware);

// Leave
router.post('/leave/apply', hrController.applyLeave);
router.get('/leave/my', hrController.getMyLeaves);
router.get('/leave/team', roleGuard('admin', 'manager'), hrController.getTeamLeaves);
router.post('/leave/:id/analyze', roleGuard('admin', 'manager'), hrController.analyzeLeave);
router.patch('/leave/:id/approve', roleGuard('admin', 'manager'), hrController.approveLeave);
router.patch('/leave/:id/reject', roleGuard('admin', 'manager'), hrController.rejectLeave);
router.get('/leave/balance/:userId', hrController.getLeaveBalance);

// Exports
router.get('/leave/export', roleGuard('admin', 'manager'), hrController.exportLeaves);
router.get('/attendance/export', roleGuard('admin', 'manager'), hrController.exportAttendance);

// Attendance
router.post('/attendance/clock-in', hrController.clockIn);
router.post('/attendance/clock-out', hrController.clockOut);
router.get('/attendance/:userId', hrController.getAttendance);

// Salary
router.get('/salary/:userId/:month', hrController.getSalarySlip);

module.exports = router;
