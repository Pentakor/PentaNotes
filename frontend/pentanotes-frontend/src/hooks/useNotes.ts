import { useState, useEffect, useMemo, useRef } from 'react';
import { Note } from '../types';
import { apiService } from '../services/api';

export const useNotes = (
  token: string | null,
  folderId?: number | null,
  tagName?: string | null
) => {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      lastTokenRef.current = null;
      setAllNotes([]);
      return;
    }
    if (lastTokenRef.current === token) {
      return;
    }
    lastTokenRef.current = token;
    void loadNotes();
  }, [token]);

  const notes = useMemo(() => {
    let filtered = allNotes;

    if (folderId !== undefined && folderId !== null) {
      filtered = filtered.filter((note) => (note.folderId ?? null) === folderId);
    }

    if (tagName) {
      const lowered = tagName.toLowerCase();
      filtered = filtered.filter((note) =>
        note.tagNames?.some((tag) => tag.toLowerCase() === lowered)
      );
    }

    return filtered;
  }, [allNotes, folderId, tagName]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await apiService.getNotes();
      setAllNotes(data);
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
      setAllNotes((prevNotes) => [newNote, ...prevNotes]);
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
      setAllNotes((prevNotes) =>
        prevNotes.map((n: Note) => (n.id === id ? updatedNote : n))
      );
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
      setAllNotes((prevNotes) => prevNotes.filter((n: Note) => n.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw err;
    }
  };

  const getAllNotes = async (): Promise<Note[]> => {
    try {
      if (!token) {
        return [];
      }
      // Ensure latest data from API and sync state
      const data = await apiService.getNotes();
      setAllNotes(data);
      return data;
    } catch (err) {
      console.error('Failed to get all notes:', err);
      throw err;
    }
  };

  return { notes, allNotes, loading, createNote, updateNote, deleteNote, refreshNotes: loadNotes, getAllNotes };
};