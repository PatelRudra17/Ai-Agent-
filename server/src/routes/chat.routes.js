const express = require('express');
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/rooms', chatController.getRooms);
router.get('/rooms/:roomId/messages', chatController.getMessages);
router.post('/rooms', chatController.createRoom);
router.post('/rooms/:roomId/message', chatController.sendMessage);

module.exports = router;
