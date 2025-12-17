import { BACKEND_PORT, BACKEND_URL } from '../config/env';

// ---------------------------
// Types
// ---------------------------
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

// ---------------------------
// HTTP Client Helper
// ---------------------------
/**
 * Builds the base URL for backend API calls
 */
function getBaseUrl(): string {
  if (!BACKEND_URL || !BACKEND_PORT) {
    throw new Error('BACKEND_URL or BACKEND_PORT is not defined in environment');
  }
  return `${BACKEND_URL}:${BACKEND_PORT}`;
}

/**
 * Generic HTTP request helper with automatic error handling
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    token: string;
    body?: Record<string, any>;
  }
): Promise<T> {
  const { method = 'GET', token, body } = options;
  const url = `${getBaseUrl()}${endpoint}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  return res.json();
}

// ---------------------------
// API Endpoints
// ---------------------------

/**
 * Creates a new note
 */
export async function createNote(
  title: string,
  content: string,
  token: string,
  folderId?: number | null
): Promise<ApiResponse> {
  const body: Record<string, any> = { title, content };
  // Don't include folderId if undefined - backend defaults to null
  if (folderId !== undefined) {
    body.folderId = folderId;
  }
  return apiRequest('/api/notes/', {
    method: 'POST',
    token,
    body,
  });
}

/**
 * Updates an existing note
 */
export async function updateNote(
  noteId: number,
  updates: {
    title?: string;
    content?: string;
    folderId?: number | null | 'ALL Notes';
  },
  token: string
): Promise<ApiResponse> {
  // Filter out undefined fields
  const body = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  return apiRequest(`/api/notes/${noteId}/`, {
    method: 'PUT',
    token,
    body,
  });
}

/**
 * Fetches all folders for the authenticated user
 */
export async function getFolders(token: string): Promise<ApiResponse> {
  return apiRequest('/api/folders/', { token });
}

/**
 * Fetches all tags for the authenticated user
 */
export async function getTags(token: string): Promise<ApiResponse> {
  return apiRequest('/api/tags/', { token });
}

/**
 * Fetches all notes for the authenticated user
 */
export async function getNotes(token: string): Promise<ApiResponse> {
  return apiRequest('/api/notes/', { token });
}

/**
 * Fetches note names (id and title) for the authenticated user
 */
export async function getNoteNames(token: string): Promise<ApiResponse> {
  return apiRequest('/api/notes/names', { token });
}

/**
 * Creates a new folder
 */
export async function createFolder(
  title: string,
  token: string
): Promise<ApiResponse> {
  return apiRequest('/api/folders/', {
    method: 'POST',
    token,
    body: { title },
  });
}

/**
 * Deletes a note
 */
export async function deleteNote(noteId: number, token: string): Promise<ApiResponse> {
  return apiRequest(`/api/notes/${noteId}/`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Deletes a folder
 */
export async function deleteFolder(folderId: number, token: string): Promise<ApiResponse> {
  return apiRequest(`/api/folders/${folderId}/`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Fetches a note by ID
 */
export async function getNoteById(noteId: number, token: string): Promise<ApiResponse> {
  return apiRequest(`/api/notes/${noteId}/`, {
    method: 'GET',
    token,
  });
}

/**
 * Fetches a folder by ID
 */
export async function getFolderById(
  folderId: number,
  token: string
): Promise<ApiResponse> {
  return apiRequest(`/api/folders/${folderId}/`, {
    method: 'GET',
    token,
  });
}
