const User = require('../models/User');
const Note = require('../models/Note');
const Message = require('../models/Message');

/**
 * @desc    Get list of all registered users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private (Admin Role Required)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get administrative dashboard statistics (Admin only)
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin Role Required)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNotes = await Note.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'Admin' });

    return res.status(200).json({
      success: true,
      message: 'Admin metrics retrieved successfully.',
      data: {
        totalUsers,
        totalAdmins,
        totalNotes,
        totalMessages,
        serverUptime: `${Math.floor(process.uptime())} seconds`,
        serverTimestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getAdminDashboard
};
