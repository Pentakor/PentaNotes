export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
}

export interface User {
  id?: number;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  password_confirm: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
