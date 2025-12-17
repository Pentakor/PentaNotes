import React, { useState } from 'react';
import { AuthForm } from './AuthForm';
import { AuthFormData, LoginCredentials } from '../types';

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onRegister: (data: AuthFormData) => Promise<void>;
  loading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, loading }) => {
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);

  const handleAuthSubmit = async (data: AuthFormData) => {
    try {
      if (showAuth === 'login') {
        await onLogin({ email: data.email, password: data.password });
      } else {
        await onRegister(data);
      }
      setShowAuth(null);
    } catch (err) {
      console.error('Authentication failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            PentaNotes
          </h1>
          <p className="text-gray-600">Your smart notes companion</p>
        </div>

        {!showAuth ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowAuth('login')}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Login
            </button>
            <button
              onClick={() => setShowAuth('register')}
              className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all"
            >
              Create Account
            </button>
          </div>
        ) : (
          <AuthForm
            type={showAuth}
            onSubmit={handleAuthSubmit}
            onCancel={() => setShowAuth(null)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};