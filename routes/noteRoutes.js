const express = require('express');
const router = express.Router();
const {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

// All Note routes require JWT authentication
router.use(protect);

// CRUD routes for personal notes
router.route('/')
  .post(createNote)
  .get(getAllNotes);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

module.exports = router;
