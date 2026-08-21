const express = require('express');
const router = express.Router();
const { createRoom, getRoomByCode, listPublicRooms } = require('../controllers/roomController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', listPublicRooms);
router.post('/', createRoom);
router.get('/:code', getRoomByCode);

module.exports = router;
