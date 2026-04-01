const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter, registerLimiter, twoFALimiter, passwordLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, passwordLimiter, authController.changePassword);
router.get('/me', authMiddleware, authController.getMe);

// 2FA
router.post('/2fa/setup', authMiddleware, authController.setup2FA);
router.post('/2fa/verify', authMiddleware, authController.verify2FA);
router.post('/2fa/validate', twoFALimiter, authController.validate2FA);
router.post('/2fa/disable', authMiddleware, authController.disable2FA);

module.exports = router;
