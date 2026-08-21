import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import NavBar from '../components/NavBar';
import api from '../api/axios';
import { getSocket } from '../api/socket';

const MOCK_ROOMS = [
  { id: 'r1', name: "Qorong'u ko'cha", players: 7, max: 12, mode: 'Public', status: "Kutilmoqda" },
  { id: 'r2', name: 'Don uyasi', players: 12, max: 12, mode: 'Private', status: 'O\'ynalmoqda' },
  { id: 'r3', name: 'Soya klubi', players: 4, max: 8, mode: 'Public', status: "Kutilmoqda" },
  { id: 'r4', name: 'Qizil oy', players: 9, max: 16, mode: 'Public', status: "Kutilmoqda" },
];

export default function LobbyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [joinCode, setJoinCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', max: 12, isPrivate: false });

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.on('rooms:update', (list) => setRooms(list));
    socket.emit('rooms:list');
    return () => socket.off('rooms:update');
  }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/rooms', newRoom);
      navigate(`/room/${res.data.room.code}`);
    } catch {
      // backend offline fallback — still let them preview a room shell
      navigate(`/room/demo`);
    }
  };

  const joinByCode = (e) => {
    e.preventDefault();
    if (joinCode.trim()) navigate(`/room/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-mist text-sm uppercase tracking-widest mb-1">Lobby</p>
            <h1 className="font-display text-3xl text-bone">
              Xush kelibsiz, <span className="text-neon-blue">{user?.username || 'mehmon'}</span>
            </h1>
          </div>
          <div className="flex gap-3">
            <form onSubmit={joinByCode} className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Kod orqali kirish"
                className="gm-input w-44"
              />
              <button className="px-4 rounded-xl glass text-bone hover:glow-blue transition">Kirish</button>
            </form>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-neon-red to-neon-red-dim text-bone glow-red hover:brightness-110 transition"
            >
              + Xona yaratish
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: 1200 }}>
          {rooms.map((room, i) => (
            <RoomCard key={room.id} room={room} index={i} onJoin={() => navigate(`/room/${room.id}`)} />
          ))}
        </div>
      </main>

      {showCreate && (
        <CreateRoomModal
          value={newRoom}
          onChange={setNewRoom}
          onClose={() => setShowCreate(false)}
          onSubmit={createRoom}
        />
      )}
    </div>
  );
}

function RoomCard({ room, index, onJoin }) {
  const full = room.players >= room.max;
  return (
    <motion.button
      onClick={onJoin}
      initial={{ opacity: 0, rotateY: -12, y: 20 }}
      animate={{ opacity: 1, rotateY: 0, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ rotateY: 4, rotateX: -2, y: -4, scale: 1.015 }}
      className="text-left glass rounded-2xl p-5 relative overflow-hidden group"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-neon-blue/10 blur-2xl group-hover:bg-neon-blue/20 transition" />
      <div className="flex items-start justify-between mb-3 relative">
        <h3 className="font-display text-lg text-bone">{room.name}</h3>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${
            room.mode === 'Private' ? 'bg-neon-red/15 text-neon-red' : 'bg-neon-blue/15 text-neon-blue'
          }`}
        >
          {room.mode === 'Private' ? 'Xususiy' : 'Ochiq'}
        </span>
      </div>
      <p className="text-mist text-xs mb-4">{room.status}</p>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {Array.from({ length: Math.min(room.players, 5) }).map((_, idx) => (
            <Avatar key={idx} avatarId="wraith" size={26} className="border-2 border-void" />
          ))}
          {room.players > 5 && (
            <span className="w-[26px] h-[26px] rounded-full bg-panel border-2 border-void flex items-center justify-center text-[10px] text-mist">
              +{room.players - 5}
            </span>
          )}
        </div>
        <span className={`text-sm font-medium ${full ? 'text-neon-red' : 'text-neon-blue'}`}>
          {room.players}/{room.max}
        </span>
      </div>
    </motion.button>
  );
}

function CreateRoomModal({ value, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.form
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onSubmit={onSubmit}
        className="glass rounded-2xl p-6 w-full max-w-sm space-y-4 glow-blue"
      >
        <h2 className="font-display text-xl text-bone">Yangi xona</h2>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-mist mb-1.5 block">Xona nomi</span>
          <input
            required
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="gm-input"
            placeholder="masalan: Qora panjara"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-mist mb-1.5 block">
            O'yinchilar soni: {value.max}
          </span>
          <input
            type="range"
            min={8}
            max={20}
            value={value.max}
            onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
            className="w-full accent-[#2fc4ff]"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input
            type="checkbox"
            checked={value.isPrivate}
            onChange={(e) => onChange({ ...value, isPrivate: e.target.checked })}
          />
          Xususiy xona (kod orqali kirish)
        </label>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl glass text-mist">
            Bekor qilish
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-blue-dim text-void font-semibold glow-blue">
            Yaratish
          </button>
        </div>
      </motion.form>
    </div>
  );
}
