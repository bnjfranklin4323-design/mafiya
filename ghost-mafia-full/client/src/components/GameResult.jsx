import { motion } from 'framer-motion';

const WINNER_STYLE = {
  mafia:    { emoji: '🔫', label: "Mafia g'olib!", color: 'text-neon-red', glow: 'glow-red' },
  civilian: { emoji: '✅', label: "Tinch fuqarolar g'olib!", color: 'text-neon-blue', glow: 'glow-blue' },
  maniac:   { emoji: '🔪', label: "Maniac g'olib!", color: 'text-neon-red', glow: 'glow-red' },
  joker:    { emoji: '🃏', label: "Joker g'olib! Hamma aldandi!", color: 'text-purple-400', glow: '' },
};

export default function GameResult({ result, onPlayAgain }) {
  if (!result) return null;
  const ws = WINNER_STYLE[result.winner] || WINNER_STYLE.civilian;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className={`glass rounded-2xl p-8 max-w-lg w-full ${ws.glow} text-center`}
      >
        <div className="text-6xl mb-3">{ws.emoji}</div>
        <h2 className={`font-display text-3xl mb-2 ${ws.color}`}>{ws.label}</h2>
        <p className="text-mist text-sm mb-6">Barcha rollar:</p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {result.players.map((p) => {
            const roleInfo = result.roles[p.username];
            return (
              <motion.div
                key={p.username}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className={`glass rounded-xl p-2.5 flex items-center gap-2 text-left ${!p.isAlive ? 'opacity-50' : ''}`}
              >
                <span className="text-xl shrink-0">{roleInfo?.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-bone truncate">{p.username} {!p.isAlive && '💀'}</p>
                  <p className="text-[10px] text-mist">{roleInfo?.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={onPlayAgain}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-blue-dim text-void font-semibold glow-blue hover:brightness-110 transition"
        >
          Yana o'ynash
        </button>
      </motion.div>
    </div>
  );
}
