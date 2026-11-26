const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAdminDashboard
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All Admin routes require both authentication and Admin role
router.use(protect);
router.use(authorizeRoles('Admin'));

router.get('/users', getAllUsers);
router.get('/dashboard', getAdminDashboard);

module.exports = router;
