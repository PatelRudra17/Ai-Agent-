const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.use(authMiddleware);

router.get('/ai-preferences', userController.getAIPreferences);
router.patch('/ai-preferences', userController.updateAIPreferences);

router.get('/', roleGuard('admin', 'manager'), userController.getUsers);
router.get('/:id', roleGuard('admin', 'manager'), userController.getUser);
router.patch('/:id', roleGuard('admin'), userController.updateUser);
router.delete('/:id', roleGuard('admin'), userController.deleteUser);

module.exports = router;
