import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AVATARS from '../components/avatars';
import Avatar from '../components/Avatar';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', avatar: AVATARS[0].id });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.username, form.password);
      } else {
        await register(form);
      }
      navigate('/lobby');
    } catch (err) {
      setError(err.response?.data?.message || 'Nimadir xato ketdi. Qayta urinib ko\'ring.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 select-none">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass glow-blue mb-4 text-3xl pulse-ring">
            🌙
          </div>
          <h1 className="font-display text-4xl tracking-wide text-bone">
            GHOST <span className="text-neon-red">MAFIA</span>
          </h1>
          <p className="text-mist mt-2 text-sm">Tunda hech kim ishonchli emas.</p>
        </div>

        <div className="glass rounded-2xl p-1.5 flex mb-6">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-neon-blue/15 text-neon-blue glow-blue'
                  : 'text-mist hover:text-bone'
              }`}
            >
              {m === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, rotateX: -8, y: 12 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, rotateX: 8, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onSubmit={submit}
            className="glass rounded-2xl p-6 space-y-4"
            style={{ transformPerspective: 1000 }}
          >
            <Field label="Foydalanuvchi nomi">
              <input
                required
                value={form.username}
                onChange={update('username')}
                placeholder="masalan: ShadowKnife"
                className="gm-input"
              />
            </Field>

            {mode === 'register' && (
              <Field label="Email (ixtiyoriy)">
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="email@misol.com"
                  className="gm-input"
                />
              </Field>
            )}

            <Field label="Parol">
              <input
                required
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                className="gm-input"
              />
            </Field>

            {mode === 'register' && (
              <Field label="Avatar tanlang">
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setForm((f) => ({ ...f, avatar: a.id }))}
                      className={`rounded-xl p-0.5 transition-all ${
                        form.avatar === a.id ? 'scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Avatar avatarId={a.id} size={36} ring={form.avatar === a.id} />
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {error && (
              <p className="text-neon-red text-sm bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              disabled={busy}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-neon-blue to-neon-blue-dim text-void glow-blue hover:brightness-110 transition disabled:opacity-50"
            >
              {busy ? 'Yuklanmoqda...' : mode === 'login' ? 'Kirish' : "Hisob yaratish"}
            </button>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-mist mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
