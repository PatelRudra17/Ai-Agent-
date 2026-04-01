const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');

// GET /api/chat — Get all rooms for current user
exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user.userId })
      .populate('participants', 'name email department')
      .sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/chat/:roomId/messages — Get paginated messages for a room
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isParticipant = room.participants.some(
      (p) => p.toString() === req.user.userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not a participant of this room' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [messages, total] = await Promise.all([
      ChatMessage.find({ roomId })
        .populate('sender', 'name email')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ChatMessage.countDocuments({ roomId }),
    ]);

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/chat — Create a new chat room
exports.createRoom = async (req, res) => {
  try {
    const { participantIds, name } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'participantIds is required' });
    }

    // Ensure current user is included
    const participants = [...new Set([req.user.userId, ...participantIds])];
    const type = participants.length === 2 ? 'direct' : 'group';

    // For direct chat, check if room already exists
    if (type === 'direct') {
      const existingRoom = await ChatRoom.findOne({
        type: 'direct',
        participants: { $all: participants, $size: 2 },
      }).populate('participants', 'name email department');

      if (existingRoom) {
        return res.json({ room: existingRoom });
      }
    }

    const room = await ChatRoom.create({
      participants,
      type,
      name: type === 'group' ? name : undefined,
    });

    const populated = await ChatRoom.findById(room._id)
      .populate('participants', 'name email department');

    res.status(201).json({ room: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/chat/:roomId/message — Send a message to a room
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isParticipant = room.participants.some(
      (p) => p.toString() === req.user.userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not a participant of this room' });
    }

    const message = await ChatMessage.create({
      roomId,
      sender: req.user.userId,
      content,
      readBy: [req.user.userId],
    });

    // Update room's lastMessage
    room.lastMessage = {
      content,
      sender: req.user.userId,
      timestamp: message.createdAt,
    };
    await room.save();

    const populated = await ChatMessage.findById(message._id)
      .populate('sender', 'name email');

    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
