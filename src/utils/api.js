import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://gigwork-backend-m6wo.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('gw_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('gw_token');
    }
    return Promise.reject(err);
  }
);

export default api;
