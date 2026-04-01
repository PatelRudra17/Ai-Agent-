const express = require('express');
const reportsController = require('../controllers/reports.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(authMiddleware);

router.post('/eod-submit', reportsController.submitEOD);
router.post('/generate', roleGuard('admin', 'manager'), reportsController.generateReport);
router.get('/', roleGuard('admin', 'manager'), reportsController.getReports);
router.get('/:id', roleGuard('admin', 'manager'), reportsController.getReport);

module.exports = router;
