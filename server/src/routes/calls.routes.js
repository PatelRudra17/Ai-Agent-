const express = require('express');
const { body } = require('express-validator');
const callsController = require('../controllers/calls.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.post('/schedule', roleGuard('admin', 'manager'), validate([
  body('recipientId').notEmpty().withMessage('Recipient ID is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('scheduledAt').isISO8601().withMessage('Valid date required'),
]), callsController.scheduleCall);

router.get('/', roleGuard('admin', 'manager'), callsController.getCalls);
router.get('/:id', roleGuard('admin', 'manager'), callsController.getCall);
router.patch('/:id/cancel', roleGuard('admin', 'manager'), callsController.cancelCall);
router.get('/employee/:userId', roleGuard('admin'), callsController.getCallsByEmployee);

module.exports = router;
