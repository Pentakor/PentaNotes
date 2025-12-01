import { useState, useEffect } from 'react';
import { Note } from '../types';
import { apiService } from '../services/api';

export const useNotes = (token: string | null, folderId?: number | null) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadNotes();
    } else {
      setNotes([]);
    }
  }, [token, folderId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = folderId
        ? await apiService.getNotesByFolder(folderId)
        : await apiService.getNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (title: string, targetFolderId?: number | null) => {
    try {
      const folderForNote = targetFolderId ?? folderId ?? null;
      const newNote = await apiService.createNote(title || 'Untitled Note', '', folderForNote);
      // FIXED: Use functional update to ensure we have the latest state
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      return newNote;
    } catch (err) {
      console.error('Failed to create note:', err);
      throw err;
    }
  };

  const updateNote = async (
    id: number,
    title: string,
    content: string,
    nextFolderId?: number | null
  ) => {
    try {
      const updatedNote = await apiService.updateNote(id, title, content, nextFolderId);
      // FIXED: Use functional update
      setNotes((prevNotes) => {
        if (folderId && updatedNote.folderId !== folderId) {
          return prevNotes.filter((n: Note) => n.id !== id);
        }
        return prevNotes.map((n: Note) => (n.id === id ? updatedNote : n));
      });
      return updatedNote;
    } catch (err) {
      console.error('Failed to update note:', err);
      throw err;
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await apiService.deleteNote(id);
      // FIXED: Use functional update
      setNotes((prevNotes) => prevNotes.filter((n: Note) => n.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw err;
    }
  };

  return { notes, loading, createNote, updateNote, deleteNote, refreshNotes: loadNotes };
};