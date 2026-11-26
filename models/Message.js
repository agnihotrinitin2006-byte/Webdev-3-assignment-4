const mongoose = require('mongoose');

/**
 * Message Schema Definition
 * Stores real-time chat messages exchanged across rooms.
 */
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a valid senderId']
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required for chat display'],
      trim: true
    },
    roomId: {
      type: String,
      required: [true, 'Message must specify a roomId'],
      trim: true,
      index: true
    },
    message: {
      type: String,
      required: [true, 'Message body cannot be empty'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound index on roomId and createdAt for efficient room message retrieval
messageSchema.index({ roomId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
