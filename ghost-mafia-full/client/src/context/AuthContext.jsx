import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { getSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        getSocket().connect();
      })
      .catch(() => {
        localStorage.removeItem('gm_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('gm_token', res.data.token);
    setUser(res.data.user);
    getSocket().connect();
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('gm_token', res.data.token);
    setUser(res.data.user);
    getSocket().connect();
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('gm_token');
    setUser(null);
    getSocket().disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
