const Conversation = require('../models/Conversation');
const { chat, chatStream, draftEmail } = require('../services/gemini.service');
const { getIO } = require('../config/socket');

// POST /api/ai/chat — Send message to AI assistant (streaming via Socket.io)
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId: req.user.userId });
      if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    } else {
      // Create new conversation with first message as title
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      conversation = await Conversation.create({
        userId: req.user.userId,
        title,
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({ role: 'user', content: message });

    // Build messages array for Gemini
    const chatMessages = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Try streaming via Socket.io
    try {
      const io = getIO();
      const stream = await chatStream(chatMessages);

      let fullResponse = '';
      for await (const chunk of stream) {
        const text = chunk.text();
        fullResponse += text;
        io.to(req.user.userId).emit('ai_stream', {
          conversationId: conversation._id,
          chunk: text,
        });
      }

      // Signal stream end
      io.to(req.user.userId).emit('ai_stream_end', {
        conversationId: conversation._id,
      });

      // Save assistant response
      conversation.messages.push({ role: 'assistant', content: fullResponse });
      conversation.lastActivity = new Date();
      conversation.tokenCount += message.length + fullResponse.length; // rough estimate
      await conversation.save();

      res.json({
        conversationId: conversation._id,
        response: fullResponse,
      });
    } catch (streamErr) {
      // Fallback to non-streaming
      console.error('Stream failed, using non-stream:', streamErr.message);
      const response = await chat(chatMessages);

      conversation.messages.push({ role: 'assistant', content: response });
      conversation.lastActivity = new Date();
      await conversation.save();

      res.json({
        conversationId: conversation._id,
        response,
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};

// GET /api/ai/conversations — List conversation history
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.userId })
      .select('title lastActivity language messages')
      .sort({ lastActivity: -1 })
      .limit(50);

    // Return with message count, not full messages
    const result = conversations.map((c) => ({
      _id: c._id,
      title: c.title,
      lastActivity: c.lastActivity,
      language: c.language,
      messageCount: c.messages.length,
    }));

    res.json({ conversations: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/ai/conversations/:id — Get full conversation
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/ai/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/ai/draft-email — Draft professional email from rough notes
exports.draftEmailEndpoint = async (req, res) => {
  try {
    const { notes, language } = req.body;
    if (!notes) return res.status(400).json({ message: 'Notes required' });

    const result = await draftEmail(notes, language || 'en');
    res.json({ draft: result });
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};
