import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

const readStored = () => {
  try {
    const raw = localStorage.getItem('elegai_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStored);
  const [loading, setLoading] = useState(true);

  // Restore session: validate the stored JWT via /auth/me.
  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('elegai_token');
    if (token) {
      api
        .get('/auth/me')
        .then(({ data }) => {
          if (active) setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('elegai_token');
          localStorage.removeItem('elegai_user');
          if (active) setUser(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, []);

  // Force logout when the API reports an invalid session.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('elegai:unauthorized', onUnauthorized);
    return () => window.removeEventListener('elegai:unauthorized', onUnauthorized);
  }, []);

  const persist = useCallback((data) => {
    localStorage.setItem('elegai_token', data.token);
    localStorage.setItem('elegai_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email, password, captchaToken = '') => {
      const { data } = await api.post('/auth/login', { email, password, captchaToken });
      persist(data);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (name, email, password, captchaToken = '') => {
      const { data } = await api.post('/auth/register', { name, email, password, captchaToken });
      persist(data);
      return data.user;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('elegai_token');
    localStorage.removeItem('elegai_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
