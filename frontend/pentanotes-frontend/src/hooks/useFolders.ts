import { useState, useEffect } from 'react';
import { Folder } from '../types';
import { apiService } from '../services/api';

export const useFolders = (token: string | null) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadFolders();
    } else {
      setFolders([]);
    }
  }, [token]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getFolders();
      setFolders(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (title: string) => {
    try {
      const folder = await apiService.createFolder(title);
      setFolders((prev) => [folder, ...prev]);
      return folder;
    } catch (err) {
      console.error('Failed to create folder:', err);
      throw err;
    }
  };

  const updateFolder = async (id: number, updates: { title?: string }) => {
    try {
      const folder = await apiService.updateFolder(id, updates);
      setFolders((prev) => prev.map((f) => (f.id === id ? folder : f)));
      return folder;
    } catch (err) {
      console.error('Failed to update folder:', err);
      throw err;
    }
  };

  const deleteFolder = async (id: number) => {
    try {
      await apiService.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Failed to delete folder:', err);
      throw err;
    }
  };

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    refreshFolders: loadFolders,
  };
};


