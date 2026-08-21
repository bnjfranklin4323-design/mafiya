import AVATARS from './avatars';

export default function Avatar({ avatarId, size = 48, ring = false, className = '' }) {
  const av = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];
  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${ring ? 'ring-2 ring-neon-blue/60' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `linear-gradient(145deg, ${av.from}, ${av.to})`,
      }}
    >
      {av.glyph}
    </div>
  );
}
