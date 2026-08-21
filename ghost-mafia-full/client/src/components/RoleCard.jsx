import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_COLORS = {
  mafia:     { from: '#ff3559', to: '#3a0d18', team: 'Mafia jamoasi' },
  don:       { from: '#ff3559', to: '#000' ,   team: 'Mafia rahbari' },
  detective: { from: '#2fc4ff', to: '#0d3a52', team: 'Tinch fuqarolar' },
  doctor:    { from: '#4ade80', to: '#0d3a1f', team: 'Tinch fuqarolar' },
  sniper:    { from: '#f59e0b', to: '#3a2a0d', team: 'Tinch fuqarolar' },
  bodyguard: { from: '#2fc4ff', to: '#0d1f3a', team: 'Tinch fuqarolar' },
  joker:     { from: '#a855f7', to: '#1f0d3a', team: 'Neytral' },
  maniac:    { from: '#ff3559', to: '#000',     team: 'Yolg\'iz qotil' },
  civilian:  { from: '#8a93b2', to: '#11131f', team: 'Tinch fuqarolar' },
};

export default function RoleCard({ myRole, mafiaTeam }) {
  const [revealed, setRevealed] = useState(false);
  if (!myRole) return null;
  const colors = ROLE_COLORS[myRole.role] || ROLE_COLORS.civilian;

  return (
    <div className="perspective-1000">git
      <motion.div
        animate={{ rotateY: revealed ? 0 : 180 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setRevealed(true)}
      >
        {/* Front — hidden */}
        <div
          className="glass rounded-2xl p-5 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-5xl mb-2">❓</p>
          <p className="text-mist text-sm">Rolni ko'rish uchun bosing</p>
        </div>

        {/* Back — revealed */}
        <div
          className="absolute inset-0 rounded-2xl p-5 text-center"
          style={{
            backfaceVisibility: 'hidden',
            background: `linear-gradient(145deg, ${colors.from}33, ${colors.to})`,
            border: `1px solid ${colors.from}44`,
          }}
        >
          <p className="text-4xl mb-1">{myRole.emoji}</p>
          <p className="font-display text-xl text-bone">{myRole.label}</p>
          <p className="text-xs text-mist mt-0.5">{colors.team}</p>
          {mafiaTeam.length > 0 && (
            <p className="text-[11px] text-neon-red mt-2">
              Jamoangiz: {mafiaTeam.join(', ')}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
