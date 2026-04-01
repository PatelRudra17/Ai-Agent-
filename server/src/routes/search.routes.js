const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const Document = require('../models/Document');

const router = express.Router();
router.use(authMiddleware);

// GET /api/search?q=keyword
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });

    const regex = new RegExp(q, 'i');

    const [users, tasks, meetings, documents] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }, { department: regex }] }).select('name email role department').limit(5),
      Task.find({ $or: [{ title: regex }, { description: regex }] }).select('title status priority assignedTo').populate('assignedTo', 'name').limit(5),
      Meeting.find({ $or: [{ title: regex }, { agenda: regex }] }).select('title scheduledAt status').limit(5),
      Document.find({ $or: [{ originalName: regex }] }).select('originalName createdAt').limit(5),
    ]);

    const results = [
      ...users.map((u) => ({ type: 'employee', id: u._id, title: u.name, subtitle: `${u.role} — ${u.email}`, link: '/employees' })),
      ...tasks.map((t) => ({ type: 'task', id: t._id, title: t.title, subtitle: `${t.status} — ${t.assignedTo?.name || ''}`, link: `/tasks` })),
      ...meetings.map((m) => ({ type: 'meeting', id: m._id, title: m.title, subtitle: new Date(m.scheduledAt).toLocaleDateString(), link: '/meetings' })),
      ...documents.map((d) => ({ type: 'document', id: d._id, title: d.originalName, subtitle: new Date(d.createdAt).toLocaleDateString(), link: '/documents' })),
    ];

    res.json({ results, query: q });
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

module.exports = router;
