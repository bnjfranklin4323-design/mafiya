import { motion, AnimatePresence } from 'framer-motion';

const PHASES = {
  lobby:  { label: 'Lobby',          emoji: '🎮', color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
  night:  { label: 'Kecha',          emoji: '🌙', color: 'text-indigo-300', bg: 'bg-indigo-900/30' },
  day:    { label: 'Kunduz',         emoji: '☀️', color: 'text-yellow-300', bg: 'bg-yellow-900/20' },
  voting: { label: 'Ovoz berish',    emoji: '🗳️', color: 'text-neon-red',  bg: 'bg-neon-red/10'  },
  ended:  { label: "O'yin tugadi",   emoji: '🏁', color: 'text-bone',      bg: 'bg-white/5'       },
};

export default function PhaseBanner({ phase, dayCount, timer }) {
  const info = PHASES[phase] || PHASES.lobby;
  const urgent = timer !== null && timer <= 10;

  return (
    <div className={`glass rounded-xl px-4 py-3 flex items-center justify-between ${info.bg}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{info.emoji}</span>
        <div>
          <p className={`font-display text-sm ${info.color}`}>{info.label}</p>
          {dayCount > 0 && <p className="text-[10px] text-mist">{dayCount}-kun</p>}
        </div>
      </div>
      {timer !== null && (
        <AnimatePresence mode="wait">
          <motion.span
            key={timer}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`font-display text-2xl tabular-nums ${urgent ? 'text-neon-red' : info.color}`}
          >
            {timer}s
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}
