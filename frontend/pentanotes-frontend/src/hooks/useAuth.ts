import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { User, AuthFormData, LoginCredentials } from '../types';
import { TOKEN_KEY } from '../config/constants';
import { useModal } from '../contexts/ModalContext';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { showError } = useModal();

  const lastProfileToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      lastProfileToken.current = null;
      setProfileLoading(false);
      setUser(null);
      return;
    }
    if (lastProfileToken.current === token) {
      return;
    }
    lastProfileToken.current = token;
    void loadProfile(token);
  }, [token]);

  const loadProfile = async (currentToken: string) => {
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

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) {
      try {
        const parsed = JSON.parse(err.message);
        if (typeof parsed === 'string') {
          return parsed;
        }
        if (parsed && typeof parsed === 'object' && 'message' in parsed) {
          const message = (parsed as { message?: unknown }).message;
          if (typeof message === 'string') {
            return message;
          }
        }
      } catch {
        // message was not JSON encoded, fall through
      }
      return err.message || fallback;
    }
    if (typeof err === 'object' && err && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    return fallback;
  };

  const register = async (data: AuthFormData) => {
    setLoading(true);
    try {
      const response = await apiService.register(data);
      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed');
      showError(message, 'Registration Failed');
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
      const message = getErrorMessage(err, 'Login failed');
      showError(message, 'Login Failed');
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