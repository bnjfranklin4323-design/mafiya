const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token topilmadi. Iltimos, qayta kiring.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ghost_mafia_dev_secret');
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token yaroqsiz yoki muddati tugagan.' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Bu amal faqat adminlar uchun.' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware };
