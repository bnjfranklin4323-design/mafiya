const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPrivate: { type: Boolean, default: false },
    maxPlayers: { type: Number, default: 12, min: 8, max: 20 },
    players: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, default: null },
        isAlive: { type: Boolean, default: true },
        isMuted: { type: Boolean, default: false },
      },
    ],
    roleConfig: {
      mafia: { type: Number, default: 2 },
      don: { type: Number, default: 1 },
      detective: { type: Number, default: 1 },
      doctor: { type: Number, default: 1 },
      sniper: { type: Number, default: 0 },
      bodyguard: { type: Number, default: 0 },
      joker: { type: Number, default: 0 },
      maniac: { type: Number, default: 0 },
    },
    phase: { type: String, enum: ['lobby', 'night', 'day', 'voting', 'ended'], default: 'lobby' },
    dayCount: { type: Number, default: 0 },
    timerSeconds: { type: Number, default: 60 },
    status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
