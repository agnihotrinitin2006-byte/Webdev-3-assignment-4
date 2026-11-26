const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public authentication endpoints
router.post('/signup', registerUser);
router.post('/login', loginUser);

// Protected profile endpoint
router.get('/profile', protect, getUserProfile);

module.exports = router;
