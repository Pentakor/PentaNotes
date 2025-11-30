import { useState, useEffect } from 'react';
import { Note } from '../types';
import { apiService } from '../services/api';

export const useNotes = (token: string | null) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadNotes();
    }
  }, [token]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await apiService.getNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (title: string) => {
    try {
      const newNote = await apiService.createNote(title || 'Untitled Note', '');
      // FIXED: Use functional update to ensure we have the latest state
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      return newNote;
    } catch (err) {
      console.error('Failed to create note:', err);
      throw err;
    }
  };

  const updateNote = async (id: number, title: string, content: string) => {
    try {
      const updatedNote = await apiService.updateNote(id, title, content);
      // FIXED: Use functional update
      setNotes((prevNotes) => prevNotes.map((n: Note) => n.id === id ? updatedNote : n));
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