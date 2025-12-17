import { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';
import { apiService } from '../services/api';

export const useTags = (token: string | null) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      lastTokenRef.current = null;
      setTags([]);
      return;
    }
    if (lastTokenRef.current === token) {
      return;
    }
    lastTokenRef.current = token;
    void loadTags();
  }, [token]);

  const loadTags = async (): Promise<Tag[]> => {
    setLoading(true);
    try {
      const data = await apiService.getTags();
      const normalized = Array.isArray(data) ? data : [];
      setTags(normalized);
      return normalized;
    } catch (err) {
      console.error('Failed to load tags:', err);
      setTags([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    tags,
    loading,
    refreshTags: loadTags,
  };
};

