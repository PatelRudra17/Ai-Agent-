const User = require('../models/User');

// GET /api/users - List all users (admin/manager)
exports.getUsers = async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Managers can only see their team
    if (req.user.role === 'manager') {
      filter.managerId = req.user.userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('managerId', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/users/:id - Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/users/:id - Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, department, role, managerId, isActive, preferredLanguage } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (role) updateData.role = role;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/users/ai-preferences — Get current user's AI mode preferences
exports.getAIPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('aiPreferences');
    res.json({ aiPreferences: user?.aiPreferences || { masterMode: 'automation', features: {} } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/users/ai-preferences — Update current user's AI mode preferences
exports.updateAIPreferences = async (req, res) => {
  try {
    const { masterMode, features } = req.body;
    const update = {};

    if (masterMode) update['aiPreferences.masterMode'] = masterMode;
    if (features) {
      for (const [key, value] of Object.entries(features)) {
        if (['automation', 'ai'].includes(value)) {
          update[`aiPreferences.features.${key}`] = value;
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true }).select('aiPreferences');
    res.json({ message: 'AI preferences updated', aiPreferences: user.aiPreferences });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/users/:id - Deactivate user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
