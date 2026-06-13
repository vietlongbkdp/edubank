import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edubank_user')) || null; } catch { return null; }
  });

  const saveSession = ({ token, user }) => {
    localStorage.setItem('edubank_token', token);
    localStorage.setItem('edubank_user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    const { data } = await client.post('/auth', { action: 'login', email, password });
    saveSession(data.data);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await client.post('/auth', { action: 'register', ...payload });
    saveSession(data.data);
    return data.data.user;
  };

  const loginGoogle = async (credential, role) => {
    const { data } = await client.post('/auth', { action: 'google', credential, role });
    saveSession(data.data);
    return data.data.user;
  };

  const updateUser = (u) => {
    localStorage.setItem('edubank_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('edubank_token');
    localStorage.removeItem('edubank_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
