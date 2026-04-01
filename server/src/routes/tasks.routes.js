const express = require('express');
const { body } = require('express-validator');
const tasksController = require('../controllers/tasks.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.post('/', roleGuard('admin', 'manager'), validate([
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('assignedTo').notEmpty().withMessage('AssignedTo is required'),
]), tasksController.createTask);

router.post('/suggest-assignee', roleGuard('admin', 'manager'), tasksController.suggestAssignee);
router.get('/my', tasksController.getMyTasks);
router.get('/team', roleGuard('admin', 'manager'), tasksController.getTeamTasks);
router.get('/dashboard', roleGuard('admin', 'manager'), tasksController.getTaskDashboard);
router.get('/overdue', roleGuard('admin', 'manager'), tasksController.getOverdueTasks);
router.get('/export', roleGuard('admin', 'manager'), tasksController.exportTasks);
router.get('/:id', tasksController.getTaskById);
router.patch('/:id/start', tasksController.startTask);
router.patch('/:id/complete', tasksController.completeTask);
router.patch('/:id/status', roleGuard('admin', 'manager'), tasksController.updateStatus);
router.post('/:id/comment', tasksController.addComment);

module.exports = router;
