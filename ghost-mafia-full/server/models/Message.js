const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    channel: { type: String, enum: ['global', 'room', 'dead'], default: 'global' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, maxlength: 500 },
    type: { type: String, enum: ['text', 'emoji', 'gif'], default: 'text' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
