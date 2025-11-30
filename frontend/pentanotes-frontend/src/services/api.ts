import { API_URL, TOKEN_KEY } from '../config/constants';
import { Note, User, AuthFormData, LoginCredentials } from '../types';

class ApiService {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  async register(data: AuthFormData): Promise<{ token: string }> {
    const res = await fetch(`${API_URL}/auth/register/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error));
    }
    
    const response = await res.json();
    return { token: response.data?.token || response.token };
  }

  async login(credentials: LoginCredentials): Promise<{ token: string }> {
    const res = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    
    if (!res.ok) {
      const error = await res.json();
      console.error('Login failed:', error);
      throw new Error(JSON.stringify(error));
    }
    
    const response = await res.json();
    console.log('Login successful, response:', response);
    return { token: response.data?.token || response.token };
  }

  async logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout/`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
  }

  async getProfile(): Promise<User> {
    const res = await fetch(`${API_URL}/auth/profile/`, {
      headers: this.getHeaders(true),
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch profile');
    }
    
    const response = await res.json();
    return response.data?.user || response.user || response;
  }

  async getNotes(): Promise<Note[]> {
    const res = await fetch(`${API_URL}/notes/`, {
      headers: this.getHeaders(true),
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch notes');
    }
    
    const response = await res.json();
    console.log('Notes response:', response);
    // FIXED: Check for notes array in data.notes or data
    return response.data?.notes || response.data || response;
  }

  async createNote(title: string, content: string): Promise<Note> {
    const res = await fetch(`${API_URL}/notes/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ title, content }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to create note');
    }
    
    const response = await res.json();
    console.log('Create note response:', response);
    // FIXED: Extract note from nested structure data.note
    return response.data?.note || response.data || response;
  }

  async updateNote(id: number, title: string, content: string): Promise<Note> {
    const res = await fetch(`${API_URL}/notes/${id}/`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ title, content }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to update note');
    }
    
    const response = await res.json();
    // FIXED: Extract note from nested structure data.note
    return response.data?.note || response.data || response;
  }

  async deleteNote(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/notes/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    
    if (!res.ok) {
      throw new Error('Failed to delete note');
    }
  }
}

export const apiService = new ApiService();