const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(authMiddleware);
router.use(roleGuard('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.changeRole);
router.patch('/users/:id/deactivate', adminController.deactivateUser);
router.patch('/users/:id/activate', adminController.activateUser);
router.get('/audit-log', adminController.getAuditLog);
router.get('/audit-log/export', adminController.exportAuditLog);
router.delete('/data/cleanup', adminController.cleanupData);
router.get('/system/health', adminController.getSystemHealth);

module.exports = router;
