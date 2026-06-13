import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem('gw_token');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        }
      } catch (_) {
        await AsyncStorage.removeItem('gw_token');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('gw_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    await AsyncStorage.setItem('gw_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('gw_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);