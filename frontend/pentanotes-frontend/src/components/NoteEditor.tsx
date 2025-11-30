import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2, Search } from 'lucide-react';
import { Note } from '../types';

interface NoteEditorProps {
  note: Note | null;
  onUpdate: (id: number, title: string, content: string) => Promise<Note>;
  onDelete: (id: number) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsEditing(false);
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;
    try {
      await onUpdate(note.id, title, content);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleCancel = () => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!note) return;
    onDelete(note.id);
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Select a note or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Note Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold w-full border-b-2 border-indigo-600 focus:outline-none"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900">{note.title}</h2>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 border border-gray-300 text-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none font-mono"
            placeholder="Start typing..."
          />
        ) : (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-1000 text-2xl leading-relaxed">
              {note.content || 'No content'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};