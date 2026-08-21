import { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';

const EMOJIS = ['😂','👀','🔫','❤️','💀','🎩','🔍','🩺','🛡️','🎯','🃏','👋','😈','🤫','👌'];
const CHANNELS = [
  { id: 'room',   label: 'Xona',   icon: '🎮' },
  { id: 'global', label: 'Global', icon: '🌍' },
  { id: 'dead',   label: 'O\'lganlar', icon: '💀' },
];

export default function ChatPanel({ messages, onSend, myDead = false }) {
  const [channel, setChannel] = useState('room');
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = messages.filter((m) => m.channel === channel || (channel === 'room' && !m.channel));

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(channel, text);
    setText('');
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden">
      {/* Channel tabs */}
      <div className="flex border-b border-white/5">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannel(c.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              channel === c.id ? 'text-neon-blue border-b-2 border-neon-blue' : 'text-mist hover:text-bone'
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {filtered.length === 0 && (
          <p className="text-mist text-xs text-center mt-8">Hali xabar yo'q</p>
        )}
        {filtered.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.sender === 'TIZIM' ? 'justify-center' : ''}`}>
            {m.sender === 'TIZIM' ? (
              <span className="text-[11px] text-mist/70 italic text-center">{m.text}</span>
            ) : (
              <>
                <Avatar avatarId={m.avatar} size={24} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-neon-blue/80 font-medium">{m.sender} </span>
                  <span className="text-sm text-bone/90 break-words">{m.text}</span>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-2 py-1.5 border-t border-white/5 flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => { setText((t) => t + e); setShowEmoji(false); }} className="text-lg hover:scale-125 transition-transform">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 p-2 border-t border-white/5">
        <button type="button" onClick={() => setShowEmoji((s) => !s)} className="text-lg shrink-0 hover:scale-110 transition-transform">
          😊
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={channel === 'dead' && !myDead ? "Faqat o'lganlar uchun" : "Xabar..."}
          disabled={channel === 'dead' && !myDead}
          maxLength={400}
          className="gm-input flex-1 text-sm py-1.5"
        />
        <button className="px-3 rounded-xl bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 transition">
          ↑
        </button>
      </form>
    </div>
  );
}
