const Note = require('../models/Note');
const { appEventEmitter } = require('../events/eventEmitter');

/**
 * @desc    Create a new note
 * @route   POST /api/notes
 * @access  Private (JWT protected)
 */
const createNote = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate input fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Title and description are required.'
      });
    }

    // Create note associated with current authenticated user
    const note = await Note.create({
      title: title.trim(),
      description: description.trim(),
      userId: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Emit event
    appEventEmitter.emit('noteCreated', {
      id: note._id,
      userId: req.user._id,
      title: note.title
    });

    return res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      note
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all notes belonging to the logged-in user
 * @route   GET /api/notes
 * @access  Private (JWT protected)
 */
const getAllNotes = async (req, res, next) => {
  try {
    // Only return notes where userId matches the authenticated user
    const notes = await Note.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single note by ID
 * @route   GET /api/notes/:id
 * @access  Private (JWT protected)
 */
const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id: ${req.params.id}`
      });
    }

    // Verify ownership: users can only view their own notes
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access another user\'s note.'
      });
    }

    return res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a personal note
 * @route   PUT /api/notes/:id
 * @access  Private (JWT protected)
 */
const updateNote = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate that at least one field is provided
    if (!title && !description) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Please provide at least title or description to update.'
      });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id: ${req.params.id}`
      });
    }

    // Verify ownership: users cannot modify other users' notes
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify another user\'s note.'
      });
    }

    // Apply updates
    if (title) note.title = title.trim();
    if (description) note.description = description.trim();
    note.updatedAt = new Date();

    const updatedNote = await note.save();

    // Emit event
    appEventEmitter.emit('noteUpdated', {
      id: updatedNote._id,
      userId: req.user._id,
      title: updatedNote.title
    });

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      note: updatedNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a personal note
 * @route   DELETE /api/notes/:id
 * @access  Private (JWT protected)
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id: ${req.params.id}`
      });
    }

    // Verify ownership: users cannot delete other users' notes
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete another user\'s note.'
      });
    }

    await note.deleteOne();

    // Emit event
    appEventEmitter.emit('noteDeleted', {
      id: req.params.id,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote
};
