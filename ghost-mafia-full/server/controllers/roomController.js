const Room = require('../models/Room');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

exports.createRoom = async (req, res) => {
  try {
    const { name, max, isPrivate } = req.body;
    let code = generateCode();
    while (await Room.findOne({ code })) code = generateCode();

    const room = await Room.create({
      code,
      name: name || `${req.userId}ning xonasi`,
      host: req.userId,
      isPrivate: !!isPrivate,
      maxPlayers: max || 12,
      players: [{ user: req.userId }],
    });

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Xona yaratib bo\'lmadi: ' + err.message });
  }
};

exports.getRoomByCode = async (req, res) => {
  const room = await Room.findOne({ code: req.params.code.toUpperCase() })
    .populate('players.user', 'username avatar')
    .populate('host', 'username');
  if (!room) return res.status(404).json({ message: 'Xona topilmadi.' });
  res.json({ room });
};

exports.listPublicRooms = async (req, res) => {
  const rooms = await Room.find({ isPrivate: false, status: { $ne: 'finished' } })
    .select('code name players maxPlayers status phase')
    .limit(30);
  res.json({ rooms });
};
