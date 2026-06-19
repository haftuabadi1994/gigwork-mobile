import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
//export const API_BASE = 'http://192.168.1.31:5000/api';
//export const API_BASE = 'http://10.10.3.83:5000/api';
//export const API_BASE = 'http://192.168.56.1:5000/api';
//export const API_BASE = 'http://192.168.1.4:5000/api';
 export const API_BASE = 'http://10.10.3.52:5000/api';

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