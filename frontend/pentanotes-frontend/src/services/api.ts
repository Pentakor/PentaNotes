import { API_URL, TOKEN_KEY } from '../config/constants';
import { Note, User, AuthFormData, LoginCredentials, Folder, Tag } from '../types';

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

  async getNoteById(id: number): Promise<Note> {
    const res = await fetch(`${API_URL}/notes/${id}/`, {
      headers: this.getHeaders(true),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch note');
    }

    const response = await res.json();
    return response.data?.note || response.data || response;
  }

  async getNotesByFolder(folderId: number): Promise<Note[]> {
    const res = await fetch(`${API_URL}/folders/${folderId}/notes`, {
      headers: this.getHeaders(true),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch folder notes');
    }

    const response = await res.json();
    return response.data?.notes || response.data || response;
  }

  async createNote(title: string, content: string, folderId?: number | null): Promise<Note> {
    const payload: Record<string, unknown> = { title, content };
    if (folderId !== undefined && folderId !== null) {
      payload.folderId = folderId;
    }

    const res = await fetch(`${API_URL}/notes/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = 'Failed to create note';
      try {
        const errorBody = await res.json();
        if (errorBody?.message) {
          errorMessage = errorBody.message;
        }
      } catch (parseErr) {
        console.error('Failed to parse create note error response:', parseErr);
      }
      throw new Error(errorMessage);
    }

    const response = await res.json();
    console.log('Create note response:', response);
    // FIXED: Extract note from nested structure data.note
    return response.data?.note || response.data || response;
  }

  async updateNote(id: number, title: string, content: string, folderId?: number | null): Promise<Note> {
    const payload: Record<string, unknown> = { title, content };
    // Only include folderId if it's a valid number (not null or undefined)
    if (folderId !== undefined && folderId !== null) {
      payload.folderId = folderId;
    }

    const res = await fetch(`${API_URL}/notes/${id}/`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
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

  async getFolders(): Promise<Folder[]> {
    const res = await fetch(`${API_URL}/folders/`, {
      headers: this.getHeaders(true),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch folders');
    }

    const response = await res.json();
    const payload =
      response.data?.folders ||
      response.folders ||
      response.data?.notes || // backend currently returns data.notes
      response.data ||
      response;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload?.folders && Array.isArray(payload.folders)) {
      return payload.folders;
    }

    if (payload?.notes && Array.isArray(payload.notes)) {
      return payload.notes;
    }

    return [];
  }

  async createFolder(title: string): Promise<Folder> {
    const res = await fetch(`${API_URL}/folders/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      let errorMessage = 'Failed to create folder';
      try {
        const errorBody = await res.json();
        if (errorBody?.message) {
          errorMessage = errorBody.message;
        }
      } catch (parseErr) {
        console.error('Failed to parse create folder error response:', parseErr);
      }
      throw new Error(errorMessage);
    }

    const response = await res.json();
    return response.data?.folder || response.data || response;
  }

  async updateFolder(id: number, payload: { title?: string }): Promise<Folder> {
    const res = await fetch(`${API_URL}/folders/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to update folder');
    }

    const response = await res.json();
    return response.data?.folder || response.data || response;
  }

  async deleteFolder(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/folders/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!res.ok) {
      throw new Error('Failed to delete folder');
    }
  }

  async getTags(): Promise<Tag[]> {
    const res = await fetch(`${API_URL}/tags/`, {
      headers: this.getHeaders(true),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch tags');
    }

    const response = await res.json();
    const payload = response.data?.tags || response.tags || response.data || response;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload?.tags && Array.isArray(payload.tags)) {
      return payload.tags;
    }

    return [];
  }

  async getNotesByTag(tagId: number): Promise<Note[]> {
    const res = await fetch(`${API_URL}/tags/${tagId}/notes`, {
      headers: this.getHeaders(true),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch notes for tag');
    }

    const response = await res.json();
    return response.data?.notes || response.notes || response.data || response;
  }
}

export const apiService = new ApiService();