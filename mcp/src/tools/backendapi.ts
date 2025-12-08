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
