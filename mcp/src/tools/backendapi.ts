import { BACKEND_PORT, BACKEND_URL} from '../config/env';

type CreateNoteResponse = {
  success: boolean;
  data?: any;
  message?: string;
};

export async function createNote(title: string, content: string, token: string): Promise<CreateNoteResponse> {

  if (!BACKEND_URL || !BACKEND_PORT) {
    throw new Error("BACKEND_URL or BACKEND_PORT is not defined in env");
  }
  const url = `${BACKEND_URL}:${BACKEND_PORT}/api/notes/`;
  console.log(url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      content,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create note: ${res.status} - ${errorText}`);
  }

  return res.json();
}


type UpdateNoteResponse = {
  success: boolean;
  data?: any;
  message?: string;
};

export async function updateNote(
  noteId: number,
  updates: {
    title?: string;
    content?: string;
    folderId?: number;
  },
  token: string
): Promise<UpdateNoteResponse> {

  if (!BACKEND_URL || !BACKEND_PORT) {
    throw new Error("BACKEND_URL or BACKEND_PORT is not defined in env");
  }

  const url = `${BACKEND_URL}:${BACKEND_PORT}/api/notes/${noteId}/`;
  console.log(url);

  // Only include fields that are actually defined
  const body: any = {};
  if (updates.title !== undefined) body.title = updates.title;
  if (updates.content !== undefined) body.content = updates.content;
  if (updates.folderId !== undefined) body.folderId = updates.folderId;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update note: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function getFolders(token: string) {
  if (!BACKEND_URL || !BACKEND_PORT) {
    throw new Error("BACKEND_URL or BACKEND_PORT is not defined in env");
  }

  const url = `${BACKEND_URL}:${BACKEND_PORT}/api/folders/`;
  console.log(url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch folders: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function getTags(token: string) {
  if (!BACKEND_URL || !BACKEND_PORT) {
    throw new Error("BACKEND_URL or BACKEND_PORT is not defined in env");
  }

  const url = `${BACKEND_URL}:${BACKEND_PORT}/api/tags/`;
  console.log(url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch tags: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function getNotes(token: string) {
  if (!BACKEND_URL || !BACKEND_PORT) {
    throw new Error("BACKEND_URL or BACKEND_PORT is not defined in env");
  }

  const url = `${BACKEND_URL}:${BACKEND_PORT}/api/notes/`;
  console.log(url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch notes: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function createFolder(title: string, token: string) {
  if (!BACKEND_URL || !BACKEND_PORT) {
    throw new Error("BACKEND_URL or BACKEND_PORT is not defined in env");
  }

  const url = `${BACKEND_URL}:${BACKEND_PORT}/api/folders/`;
  console.log(url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create folder: ${res.status} - ${errorText}`);
  }

  return res.json();
}

