import { useMemo } from 'react';

// Signature ambient layer: drifting fog particles + dual neon glow haze.
// Evokes night-phase mafia mist without being literal or decorative-only.
export default function FogBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 60 + Math.random() * 140,
      duration: 18 + Math.random() * 22,
      delay: -Math.random() * 30,
      blue: Math.random() > 0.5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-void bg-noise">
      <div className="absolute -top-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-neon-blue/10 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-neon-red/10 blur-[120px]" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="fog-particle absolute bottom-0 rounded-full blur-2xl"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.blue
              ? 'radial-gradient(circle, rgba(47,196,255,0.10), transparent 70%)'
              : 'radial-gradient(circle, rgba(255,53,89,0.10), transparent 70%)',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
}
