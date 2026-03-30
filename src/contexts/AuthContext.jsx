import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cb_token');
    if (!token) { setLoading(false); return; }

    api.auth.me()
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem('cb_token');
      })
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('cb_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('cb_token');
    setUser(null);
  }

  function refreshUser() {
    return api.auth.me().then(u => setUser(u));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
