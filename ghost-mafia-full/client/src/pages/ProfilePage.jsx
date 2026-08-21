import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import NavBar from '../components/NavBar';
import AVATARS from '../components/avatars';
import api from '../api/axios';
import { useState } from 'react';

const ROLE_STATS = [
  { role: 'mafia', emoji: '🔫', label: 'Mafia' },
  { role: 'detective', emoji: '🔍', label: 'Detektiv' },
  { role: 'doctor', emoji: '🩺', label: 'Doktor' },
  { role: 'civilian', emoji: '🕯️', label: 'Fuqaro' },
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editAvatar, setEditAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [friendInput, setFriendInput] = useState('');

  const stats = user?.stats || { wins: 0, losses: 0, gamesPlayed: 0, xp: 0, level: 1, coins: 0 };
  const xpForNext = stats.level * 100;
  const xpPct = Math.min(100, Math.round((stats.xp / xpForNext) * 100));
  const winRate = stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  const changeAvatar = async (avatarId) => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', { avatar: avatarId });
      setUser(res.data.user);
    } catch { /* no-op if backend offline */ }
    setSaving(false);
    setEditAvatar(false);
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <button onClick={() => setEditAvatar(true)} className="relative group shrink-0">
              <Avatar avatarId={user?.avatar} size={96} ring />
              <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs text-bone">
                O'zgartirish
              </span>
            </button>

            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="font-display text-3xl text-bone">{user?.username}</h1>
              <p className="text-mist text-sm mb-1">{user?.email || 'Email kiritilmagan'}</p>
              <div className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0 mt-3">
                <span className="text-xs text-neon-blue font-medium shrink-0 font-display">LVL {stats.level}</span>
                <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-neon-blue to-neon-blue-dim rounded-full"
                  />
                </div>
                <span className="text-xs text-mist shrink-0">{stats.xp}/{xpForNext} XP</span>
              </div>
            </div>

            <div className="flex gap-3">
              <StatBadge label="Tangalar" value={stats.coins} emoji="🪙" />
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="O'yinlar" value={stats.gamesPlayed} color="text-bone" />
          <StatCard label="G'alabalar" value={stats.wins} color="text-neon-blue" />
          <StatCard label="Mag'lubiyatlar" value={stats.losses} color="text-neon-red" />
          <StatCard label="G'alaba %" value={`${winRate}%`} color={winRate >= 50 ? 'text-neon-blue' : 'text-neon-red'} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Role win rates */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-sm text-neon-blue uppercase tracking-wider">Rollar bo'yicha statistika</h2>
            {ROLE_STATS.map(({ role, emoji, label }) => (
              <div key={role} className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-bone">{label}</span>
                    <span className="text-mist">0%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className="h-full w-0 rounded-full bg-neon-blue/50" />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-mist/60">O'yin o'ynash bilan to'ldiriladi</p>
          </div>

          {/* Friends */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-sm text-neon-blue uppercase tracking-wider">Do'stlar</h2>
            <form onSubmit={(e) => { e.preventDefault(); setFriendInput(''); }} className="flex gap-2">
              <input
                value={friendInput}
                onChange={(e) => setFriendInput(e.target.value)}
                placeholder="Foydalanuvchi nomi..."
                className="gm-input flex-1 text-sm"
              />
              <button className="px-3 rounded-xl glass text-neon-blue text-sm hover:glow-blue transition">+</button>
            </form>
            <div className="space-y-2 min-h-[80px] flex items-center justify-center">
              <p className="text-mist text-xs text-center">Hali do'stlar yo'q.<br />Foydalanuvchi nomi orqali qo'shing.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Avatar picker modal */}
      {editAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 max-w-sm w-full glow-blue"
          >
            <h3 className="font-display text-lg text-bone mb-4">Avatar tanlang</h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => changeAvatar(a.id)}
                  disabled={saving}
                  className={`rounded-xl p-1.5 transition-all ${user?.avatar === a.id ? 'ring-2 ring-neon-blue scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                >
                  <Avatar avatarId={a.id} size={48} />
                </button>
              ))}
            </div>
            <button onClick={() => setEditAvatar(false)} className="w-full py-2 rounded-xl glass text-mist text-sm">
              Bekor qilish
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <p className={`text-2xl font-display ${color}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-mist mt-1">{label}</p>
    </div>
  );
}

function StatBadge({ label, value, emoji }) {
  return (
    <div className="glass rounded-xl px-4 py-3 text-center glow-blue">
      <p className="text-xl">{emoji}</p>
      <p className="text-xl font-display text-neon-blue">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-mist">{label}</p>
    </div>
  );
}
