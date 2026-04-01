const User = require('../models/User');

const isAIMode = async (userId, feature) => {
  try {
    const user = await User.findById(userId).select('aiPreferences');
    if (!user?.aiPreferences) return false;

    // Master switch set to automation overrides everything
    if (user.aiPreferences.masterMode === 'automation') return false;

    // Check individual feature preference
    return user.aiPreferences.features?.[feature] === 'ai';
  } catch {
    return false;
  }
};

module.exports = { isAIMode };
