const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'ghost_mafia_dev_secret', {
    expiresIn: '30d',
  });
}

exports.register = async (req, res) => {
  try {
    const { username, password, email, avatar } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Foydalanuvchi nomi va parol talab qilinadi.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: 'Bu foydalanuvchi nomi band.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashed,
      email: email || '',
      avatar: avatar || 'wraith',
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Foydalanuvchi topilmadi.' });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: 'Bu hisob bloklangan.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Parol noto\'g\'ri.' });
    }

    user.isOnline = true;
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi: ' + err.message });
  }
};

exports.me = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' });
  res.json({ user: user.toSafeObject() });
};

exports.updateProfile = async (req, res) => {
  try {
    const { avatar, email } = req.body;
    const updates = {};
    if (avatar) updates.avatar = avatar;
    if (email !== undefined) updates.email = email;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
