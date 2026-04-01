const express = require('express');
const { body } = require('express-validator');
const meetingsController = require('../controllers/meetings.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.post('/create', roleGuard('admin', 'manager'), validate([
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('attendeeIds').isArray({ min: 1 }).withMessage('At least one attendee required'),
  body('scheduledAt').isISO8601().withMessage('Valid date required'),
]), meetingsController.createMeeting);

router.get('/', meetingsController.getMeetings);
router.patch('/:id/reschedule', roleGuard('admin', 'manager'), meetingsController.rescheduleMeeting);
router.delete('/:id', roleGuard('admin', 'manager'), meetingsController.cancelMeeting);
router.post('/:id/notes', meetingsController.addNotes);
router.get('/:id/summary', meetingsController.getMeetingSummary);
router.get('/:id/pre-brief', meetingsController.getPreMeetingBrief);
router.post('/:id/smart-summary', meetingsController.getSmartSummary);
router.post('/:id/create-tasks-from-actions', roleGuard('admin', 'manager'), meetingsController.createTasksFromActions);

module.exports = router;
