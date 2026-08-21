import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import FogBackground from './components/FogBackground';
import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashLoader />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function SplashLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full glass glow-blue pulse-ring flex items-center justify-center text-xl">
        🌙
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        path="/lobby"
        element={
          <Protected>
            <LobbyPage />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/room/:code"
        element={
          <Protected>
            <RoomPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FogBackground />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
