import { motion } from 'framer-motion';
import Avatar from './Avatar';

export default function PlayerCard({
  player, myRole, showRole = false,
  canTarget = false, onTarget,
  voted = false, isMe = false,
  voteCount = 0, isMuted = false,
  onKick, onMute, isAdmin = false,
}) {
  const alive = player.isAlive !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative glass rounded-xl p-3 transition-all
        ${!alive ? 'opacity-40 grayscale' : ''}
        ${isMe ? 'ring-1 ring-neon-blue/60' : ''}
        ${canTarget && alive ? 'cursor-pointer hover:glow-red hover:border-neon-red/40' : ''}
      `}
      onClick={() => canTarget && alive && onTarget?.(player.username)}
    >
      {/* Voted indicator */}
      {voteCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-neon-red text-void text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10">
          {voteCount}
        </span>
      )}

      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <Avatar avatarId={player.avatar} size={38} ring={isMe} />
          {!alive && (
            <span className="absolute -bottom-1 -right-1 text-sm">💀</span>
          )}
          {isMuted && alive && (
            <span className="absolute -top-1 -right-1 text-xs">🔇</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-bone truncate">
            {player.username} {isMe && <span className="text-[10px] text-neon-blue">(Sen)</span>}
          </p>
          {showRole && player.role && (
            <p className="text-[11px] text-mist">{player.role}</p>
          )}
          {voted && <p className="text-[10px] text-neon-blue">✓ Ovoz berdi</p>}
        </div>

        {/* Admin controls */}
        {isAdmin && !isMe && alive && (
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onMute?.(player.username); }}
              className="text-[10px] px-1.5 py-0.5 rounded glass text-mist hover:text-neon-blue transition">
              {isMuted ? '🔊' : '🔇'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onKick?.(player.username); }}
              className="text-[10px] px-1.5 py-0.5 rounded glass text-mist hover:text-neon-red transition">
              ✕
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
