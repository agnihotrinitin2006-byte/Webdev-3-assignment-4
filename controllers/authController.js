const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { appEventEmitter } = require('../events/eventEmitter');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate incoming data
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Password must be at least 6 characters long.'
      });
    }

    // 2. Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Registration Error: An account with this email already exists.'
      });
    }

    // 3. Create new user document (password hashed automatically in pre-save hook)
    const assignedRole = role && ['User', 'Admin'].includes(role) ? role : 'User';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole
    });

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role, user.email);

    // 5. Emit custom event for event-driven logging
    appEventEmitter.emit('userRegistered', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // 6. Return response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate credentials provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide email and password.'
      });
    }

    // 2. Find user in database
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email or password.'
      });
    }

    // 3. Verify password hash using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Authentication Error: Invalid email or password.'
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role, user.email);

    // 5. Emit custom event for login logging
    appEventEmitter.emit('userLoggedIn', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    // 6. Return response
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/profile
 * @access  Private (Protected by JWT)
 */
const getUserProfile = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
