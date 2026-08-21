import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/lobby" className="font-display text-lg text-bone flex items-center gap-2">
          <span className="text-xl">🌙</span> GHOST <span className="text-neon-red">MAFIA</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link to="/lobby" className={pathname === '/lobby' ? 'text-neon-blue' : 'text-mist hover:text-bone'}>
            Lobby
          </Link>
          <Link to="/profile" className={pathname === '/profile' ? 'text-neon-blue' : 'text-mist hover:text-bone'}>
            Profil
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-bone">{user?.username}</span>
            <Avatar avatarId={user?.avatar} size={34} ring />
          </Link>
          <button onClick={logout} className="text-mist hover:text-neon-red text-sm transition">
            Chiqish
          </button>
        </div>
      </div>
    </header>
  );
}
