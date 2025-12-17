import React, { useState } from 'react';
import { AuthFormData } from '../types';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (data: AuthFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    password_confirm: '',
    name: '',
  });
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password confirmation for registration
    if (type === 'register' && formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
      />
      {type === 'register' && (
        <>
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.password_confirm}
            onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          {loading ? 'Please wait...' : type === 'login' ? 'Login' : 'Register'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};