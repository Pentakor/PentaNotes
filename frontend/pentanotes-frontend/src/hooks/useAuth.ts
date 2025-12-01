import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User, AuthFormData, LoginCredentials } from '../types';
import { TOKEN_KEY } from '../config/constants';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadProfile();
    } else {
      setProfileLoading(false);
      setUser(null);
    }
  }, [token]);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const profile = await apiService.getProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Token is invalid, clear it
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const register = async (data: AuthFormData) => {
    setLoading(true);
    try {
      const response = await apiService.register(data);
      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await apiService.login(credentials);
      console.log('Setting token:', response.token);
      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
    } catch (err) {
      console.error('Login error:', err);
      alert(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return { token, user, loading: loading || profileLoading, register, login, logout };
};