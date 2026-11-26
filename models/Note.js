const mongoose = require('mongoose');

/**
 * Note Schema Definition
 * Stores personal user notes with reference to owner User ID.
 */
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a note title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a note description'],
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must belong to a registered user'],
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Create compound index for fast queries of a user's notes sorted by creation date
noteSchema.index({ userId: 1, createdAt: -1 });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
