import { useState } from 'react';

const ROLE_META = [
  { key: 'mafia',     label: 'Mafia',       emoji: '🔫', min: 1, max: 5 },
  { key: 'don',       label: 'Don',          emoji: '🎩', min: 0, max: 1 },
  { key: 'detective', label: 'Detektiv',     emoji: '🔍', min: 0, max: 2 },
  { key: 'doctor',    label: 'Doktor',       emoji: '🩺', min: 0, max: 2 },
  { key: 'sniper',    label: 'Snipper',      emoji: '🎯', min: 0, max: 2 },
  { key: 'bodyguard', label: "Qo'riqchi",   emoji: '🛡️', min: 0, max: 2 },
  { key: 'joker',     label: 'Joker',        emoji: '🃏', min: 0, max: 1 },
  { key: 'maniac',    label: 'Maniac',       emoji: '🔪', min: 0, max: 1 },
];

export default function AdminPanel({ players, onRoleConfig, onKick, onMute }) {
  const [config, setConfig] = useState({
    mafia: 2, don: 1, detective: 1, doctor: 1, sniper: 0, bodyguard: 0, joker: 0, maniac: 0,
  });
  const [timerSec, setTimerSec] = useState(60);

  const save = () => { onRoleConfig?.(config); };
  const update = (key, val) => setConfig((c) => ({ ...c, [key]: val }));

  const total = Object.values(config).reduce((a, b) => a + b, 0);

  return (
    <div className="glass rounded-2xl p-4 space-y-5">
      <h3 className="font-display text-sm text-neon-blue uppercase tracking-wider">⚙️ Admin Panel</h3>

      <div className="space-y-3">
        <p className="text-xs text-mist uppercase tracking-wider">Rollar sozlamasi <span className="text-neon-red">({total} maxsus)</span></p>
        {ROLE_META.map(({ key, label, emoji, min, max }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{emoji}</span>
            <span className="text-xs text-bone w-20 shrink-0">{label}</span>
            <input
              type="range" min={min} max={max} value={config[key]}
              onChange={(e) => update(key, Number(e.target.value))}
              className="flex-1 accent-[#2fc4ff] h-1"
            />
            <span className="text-xs text-neon-blue w-4 text-center">{config[key]}</span>
          </div>
        ))}
        <button onClick={save} className="w-full py-2 rounded-xl text-xs bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 transition">
          Saqlash
        </button>
      </div>

      <div>
        <p className="text-xs text-mist uppercase tracking-wider mb-2">O'yinchilar</p>
        <div className="space-y-2">
          {players.map((p) => (
            <div key={p.username} className="flex items-center justify-between glass rounded-lg px-3 py-1.5">
              <span className="text-sm text-bone">{p.username}</span>
              <div className="flex gap-1.5">
                <button onClick={() => onMute?.(p.username)}
                  className="text-[11px] px-2 py-0.5 rounded glass text-mist hover:text-neon-blue transition">
                  {p.isMuted ? '🔊' : '🔇'}
                </button>
                <button onClick={() => onKick?.(p.username)}
                  className="text-[11px] px-2 py-0.5 rounded glass text-mist hover:text-neon-red transition">
                  Kick
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
