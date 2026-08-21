'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const store = require('./gameStore');
const { ROLES, assignRoles, checkWinner, resolveNight, resolveVote } = require('./gameEngine');

const PHASE_TIMER = { night: 30, day: 90, voting: 40 };

// ─── helpers ────────────────────────────────────────────────────────────────
function safePlayer(p) {
  return { username: p.username, avatar: p.avatar, isAlive: p.isAlive, userId: p.userId };
}
function publicState(gs) {
  return {
    code: gs.code,
    phase: gs.phase,
    dayCount: gs.dayCount,
    players: gs.players.map(safePlayer),
    timerSeconds: gs.timerSeconds,
  };
}
function pushState(io, code) {
  const gs = store.get(code);
  if (!gs) return;
  io.to(code).emit('game:state', publicState(gs));
}
function sysMsg(io, code, text) {
  io.to(code).emit('chat:message', { sender: 'TIZIM', avatar: null, text, channel: 'room', createdAt: new Date() });
}
function startTimer(io, code, seconds, onEnd) {
  const gs = store.get(code);
  if (!gs) return;
  if (gs.timer) clearTimeout(gs.timer);
  let remaining = seconds;
  const tick = () => {
    remaining--;
    io.to(code).emit('game:timer', { seconds: remaining });
    if (remaining <= 0) { gs.timer = null; onEnd(); }
    else gs.timer = setTimeout(tick, 1000);
  };
  gs.timer = setTimeout(tick, 1000);
}

// ─── phase transitions ──────────────────────────────────────────────────────
function startNight(io, code) {
  const gs = store.get(code);
  if (!gs) return;
  gs.phase = 'night';
  gs.nightActions = {};
  gs.dayCount++;
  pushState(io, code);
  sysMsg(io, code, `🌙 ${gs.dayCount}-kecha boshlandi. Mafia harakat qilmoqda...`);
  startTimer(io, code, PHASE_TIMER.night, () => endNight(io, code));
}

function endNight(io, code) {
  const gs = store.get(code);
  if (!gs) return;
  const result = resolveNight(gs.players, gs.nightActions);
  gs.players = result.players;
  result.events.forEach((e) => sysMsg(io, code, e));
  if (!result.killed) sysMsg(io, code, '☀️ Kechasi tinch o\'tdi — hech kim halok bo\'lmadi.');
  const winner = checkWinner(gs.players);
  if (winner) return endGame(io, code, winner);
  startDay(io, code);
}

function startDay(io, code) {
  const gs = store.get(code);
  if (!gs) return;
  gs.phase = 'day';
  pushState(io, code);
  sysMsg(io, code, `☀️ Kunduz ${gs.dayCount}. Muhokama qiling va mafianni toping!`);
  startTimer(io, code, PHASE_TIMER.day, () => startVoting(io, code));
}

function startVoting(io, code) {
  const gs = store.get(code);
  if (!gs) return;
  gs.phase = 'voting';
  gs.votes = {};
  pushState(io, code);
  sysMsg(io, code, '🗳️ Ovoz berish boshlandi! Kim osish kerak?');
  startTimer(io, code, PHASE_TIMER.voting, () => endVoting(io, code));
}

function endVoting(io, code) {
  const gs = store.get(code);
  if (!gs) return;
  const { hanged, jokerWin, tieVote } = resolveVote(gs.players, gs.votes);
  if (tieVote) {
    sysMsg(io, code, '⚖️ Tenglik — bu safar hech kim osılmadi.');
  } else if (hanged) {
    const role = gs.players.find((p) => p.username === hanged)?.role;
    const roleLabel = ROLES[role]?.label || '';
    if (jokerWin) {
      sysMsg(io, code, `🃏 Joker osıldi! Hamma yutqazdi. ${hanged} aslida Joker edi!`);
      return endGame(io, code, 'joker');
    }
    sysMsg(io, code, `🪢 ${hanged} osıldi. U aslida — ${ROLES[role]?.emoji} ${roleLabel}.`);
  }
  const winner = checkWinner(gs.players);
  if (winner) return endGame(io, code, winner);
  startNight(io, code);
}

function endGame(io, code, winner) {
  const gs = store.get(code);
  if (!gs) return;
  if (gs.timer) clearTimeout(gs.timer);
  gs.phase = 'ended';
  pushState(io, code);
  const msgs = {
    mafia:    '🔫 Mafia g\'olib! Shahar mafia qo\'liga o\'tdi.',
    civilian: '✅ Tinch fuqarolar g\'olib! Mafia yo\'q qilindi.',
    maniac:   '🔪 Maniac g\'olib! U hamma bilan yolg\'iz qoldi.',
    joker:    '🃏 Joker g\'olib! Hamma aldandi.',
  };
  sysMsg(io, code, msgs[winner] || 'O\'yin tugadi.');
  const roles = {};
  gs.players.forEach((p) => { roles[p.username] = { role: p.role, label: ROLES[p.role]?.label, emoji: ROLES[p.role]?.emoji }; });
  io.to(code).emit('game:ended', { winner, roles, players: gs.players.map(safePlayer) });
}

// ─── Socket handler ──────────────────────────────────────────────────────────
module.exports = function registerSockets(io) {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ghost_mafia_dev_secret');
      const user = await User.findById(decoded.id);
      if (user) socket.user = user;
      next();
    } catch { next(); }
  });

  io.on('connection', (socket) => {
    const uname = socket.user?.username || 'mehmon';
    console.log(`🔌 ${uname} ulandi (${socket.id})`);
    if (socket.user) { socket.user.isOnline = true; socket.user.save().catch(() => {}); }

    // ── LOBBY ────────────────────────────────────────────────────────────────
    socket.on('rooms:list', async () => {
      try {
        const rooms = await Room.find({ isPrivate: false, status: { $ne: 'finished' } })
          .select('code name players maxPlayers status').limit(30).lean();
        socket.emit('rooms:update', rooms.map((r) => ({
          id: r.code, name: r.name,
          players: r.players.length, max: r.maxPlayers,
          mode: 'Public',
          status: r.status === 'playing' ? "O'ynalmoqda" : 'Kutilmoqda',
        })));
      } catch { socket.emit('rooms:update', []); }
    });

    // ── ROOM JOIN / LEAVE ─────────────────────────────────────────────────────
    socket.on('room:join', async ({ code }) => {
      if (!socket.user) return socket.emit('error', { message: 'Kirish talab qilinadi.' });
      socket.join(code);
      const gs = store.getOrCreate(code);
      const existing = gs.players.find((p) => p.userId === String(socket.user._id));
      if (!existing) {
        gs.players.push({
          userId: String(socket.user._id), username: socket.user.username,
          avatar: socket.user.avatar, role: null, isAlive: true, socketId: socket.id,
        });
      } else {
        existing.socketId = socket.id;
        existing.isAlive = existing.isAlive ?? true;
      }
      socket.data.roomCode = code;
      io.to(code).emit('room:players', gs.players.map(safePlayer));
      pushState(io, code);
      sysMsg(io, code, `👤 ${socket.user.username} xonaga kirdi.`);
    });

    socket.on('room:leave', ({ code }) => {
      socket.leave(code);
      const gs = store.get(code);
      if (gs) {
        gs.players = gs.players.filter((p) => p.userId !== String(socket.user?._id));
        io.to(code).emit('room:players', gs.players.map(safePlayer));
        sysMsg(io, code, `👤 ${socket.user?.username} xonadan chiqdi.`);
        if (gs.players.length === 0) store.del(code);
      }
    });

    // ── GAME START ────────────────────────────────────────────────────────────
    socket.on('game:start', ({ code }) => {
      const gs = store.get(code);
      if (!gs || gs.phase !== 'lobby') return;
      if (gs.players.length < 4) return socket.emit('error', { message: 'Kamida 4 ta o\'yinchi kerak.' });
      gs.players = assignRoles(gs.players, gs.roleConfig);
      gs.phase = 'night';
      // Send each player their secret role privately
      gs.players.forEach((p) => {
        const pSocket = io.sockets.sockets.get(p.socketId);
        if (pSocket) {
          pSocket.emit('game:yourRole', {
            role: p.role,
            label: ROLES[p.role]?.label,
            emoji: ROLES[p.role]?.emoji,
            team: ROLES[p.role]?.team,
          });
          // If mafia, send teammates list
          if (['mafia', 'don'].includes(p.role)) {
            const teammates = gs.players.filter((x) => ['mafia', 'don'].includes(x.role) && x.userId !== p.userId).map((x) => x.username);
            pSocket.emit('game:mafiaTeam', { teammates });
          }
        }
      });
      sysMsg(io, code, '🎮 O\'yin boshlandi! Rollar taqsimlandi.');
      startNight(io, code);
    });

    // ── NIGHT ACTIONS ─────────────────────────────────────────────────────────
    socket.on('game:action', ({ code, action, target }) => {
      const gs = store.get(code);
      if (!gs || gs.phase !== 'night') return;
      const player = gs.players.find((p) => p.socketId === socket.id && p.isAlive);
      if (!player) return;
      const actionMap = {
        mafia: 'mafiaTarget', don: 'mafiaTarget',
        detective: 'detectiveTarget', doctor: 'doctorTarget',
        sniper: 'sniperTarget', bodyguard: 'bodyguardTarget',
      };
      const key = actionMap[player.role];
      if (key) {
        gs.nightActions[key] = target;
        socket.emit('game:actionAck', { action, target });
        // If all mafia agreed, we could fast-forward — for now wait timer
      }
    });

    // ── VOTING ────────────────────────────────────────────────────────────────
    socket.on('game:vote', ({ code, target }) => {
      const gs = store.get(code);
      if (!gs || gs.phase !== 'voting') return;
      const player = gs.players.find((p) => p.socketId === socket.id && p.isAlive);
      if (!player) return;
      gs.votes[player.username] = target;
      io.to(code).emit('game:votes', gs.votes);
    });

    // ── SNIPER (day action) ───────────────────────────────────────────────────
    socket.on('game:sniperShot', ({ code, target }) => {
      const gs = store.get(code);
      if (!gs || gs.phase !== 'day') return;
      const player = gs.players.find((p) => p.socketId === socket.id && p.role === 'sniper' && p.isAlive);
      if (!player) return;
      gs.nightActions.sniperTarget = target;
      // Resolve immediately
      const targetPlayer = gs.players.find((p) => p.username === target);
      if (!targetPlayer) return;
      if (['mafia', 'don'].includes(targetPlayer.role)) {
        targetPlayer.isAlive = false;
        sysMsg(io, code, `🎯 Snipper ${target} ni o'ldirdi! U aslida ${ROLES[targetPlayer.role]?.label} edi.`);
      } else {
        player.isAlive = false;
        sysMsg(io, code, `🎯 Snipper nishonga tegmadi va o'zi halok bo'ldi!`);
      }
      pushState(io, code);
      const winner = checkWinner(gs.players);
      if (winner) endGame(io, code, winner);
    });

    // ── CHAT ──────────────────────────────────────────────────────────────────
    socket.on('chat:send', ({ code, channel, text }) => {
      if (!socket.user || !text?.trim()) return;
      const gs = code ? store.get(code) : null;
      const player = gs?.players.find((p) => p.userId === String(socket.user._id));
      // Dead players only in dead channel
      if (channel === 'room' && player && !player.isAlive) return;

      const msg = {
        sender: socket.user.username, avatar: socket.user.avatar,
        text: text.trim().slice(0, 400), channel, createdAt: new Date(),
      };
      if (channel === 'global') io.emit('chat:message', msg);
      else if (channel === 'room' && code) io.to(code).emit('chat:message', msg);
      else if (channel === 'dead' && code) {
        // Only dead players + observers see dead chat
        const deadSockets = gs?.players.filter((p) => !p.isAlive).map((p) => p.socketId) || [];
        deadSockets.forEach((sid) => io.to(sid).emit('chat:message', msg));
        io.to(socket.id).emit('chat:message', msg);
      }
    });

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    socket.on('admin:kick', ({ code, target }) => {
      const gs = store.get(code);
      if (!gs) return;
      const host = gs.players[0]; // first joiner = host for now
      if (host?.userId !== String(socket.user?._id)) return;
      const tPlayer = gs.players.find((p) => p.username === target);
      if (!tPlayer) return;
      const tSocket = io.sockets.sockets.get(tPlayer.socketId);
      if (tSocket) { tSocket.emit('admin:kicked', { reason: 'Admin tomonidan chiqarildi.' }); tSocket.leave(code); }
      gs.players = gs.players.filter((p) => p.username !== target);
      io.to(code).emit('room:players', gs.players.map(safePlayer));
      sysMsg(io, code, `👢 ${target} admin tomonidan xonadan chiqarildi.`);
    });

    socket.on('admin:mute', ({ code, target }) => {
      const gs = store.get(code);
      if (!gs) return;
      const tPlayer = gs.players.find((p) => p.username === target);
      if (tPlayer) {
        tPlayer.isMuted = !tPlayer.isMuted;
        io.to(code).emit('room:players', gs.players.map((p) => ({ ...safePlayer(p), isMuted: p.isMuted })));
        sysMsg(io, code, `🔇 ${target} ${tPlayer.isMuted ? 'ovozi o\'chirildi' : 'ovozi yoqildi'}.`);
      }
    });

    socket.on('admin:setRoleConfig', ({ code, config }) => {
      const gs = store.get(code);
      if (!gs) return;
      gs.roleConfig = config;
      socket.emit('admin:configUpdated', config);
    });

    socket.on('admin:setTimer', ({ code, seconds }) => {
      const gs = store.get(code);
      if (!gs) return;
      gs.timerSeconds = seconds;
    });

    // ── VOICE SIGNALING (WebRTC relay) ────────────────────────────────────────
    socket.on("voice:join", ({ code }) => {
      socket.join("voice:" + code);
      socket.to("voice:" + code).emit("voice:userJoined", { socketId: socket.id });
    });
    socket.on("voice:leave", ({ code }) => {
      socket.leave("voice:" + code);
      socket.to("voice:" + code).emit("voice:userLeft", { socketId: socket.id });
    });
    socket.on("voice:offer",  ({ to, sdp })      => io.to(to).emit("voice:offer",  { from: socket.id, sdp }));
    socket.on("voice:answer", ({ to, sdp })      => io.to(to).emit("voice:answer", { from: socket.id, sdp }));
    socket.on("voice:ice",    ({ to, candidate })=> io.to(to).emit("voice:ice",    { from: socket.id, candidate }));

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.user) { socket.user.isOnline = false; socket.user.save().catch(() => {}); }
      const code = socket.data?.roomCode;
      if (code) {
        const gs = store.get(code);
        if (gs) {
          const p = gs.players.find((x) => x.socketId === socket.id);
          if (p) sysMsg(io, code, `👤 ${p.username} vaqtincha uzildi.`);
        }
      }
      console.log(`❎ ${uname} uzildi`);
    });
  });
};

// Existing module.exports is already set — add voice signaling inside the io.on('connection') block
// by monkey-patching at module level is tricky, so we add a separate socket module
// and call it from server.js. The voice signals are already handled inside the sockets/index.js
// via the voice:offer / voice:answer / voice:ice / voice:join / voice:leave events emitted by VoiceChat.jsx.
// No further server code needed — the relay happens through socket.emit to specific sockets already.
