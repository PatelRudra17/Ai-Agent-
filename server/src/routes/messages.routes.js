const express = require('express');
const { body } = require('express-validator');
const messagesController = require('../controllers/messages.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.post('/schedule', roleGuard('admin', 'manager'), validate([
  body('recipientIds').isArray({ min: 1 }).withMessage('At least one recipient required'),
  body('channel').isIn(['email', 'whatsapp', 'in-app', 'slack']).withMessage('Invalid channel'),
  body('body').notEmpty().withMessage('Message body is required'),
  body('scheduledAt').isISO8601().withMessage('Valid date required'),
]), messagesController.scheduleMessage);

router.get('/', roleGuard('admin', 'manager'), messagesController.getMessages);
router.delete('/:id', roleGuard('admin', 'manager'), messagesController.cancelMessage);
router.post('/broadcast', roleGuard('admin'), messagesController.broadcastMessage);

module.exports = router;
