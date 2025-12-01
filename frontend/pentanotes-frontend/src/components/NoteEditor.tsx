import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2, Search, Folder as FolderIcon } from 'lucide-react';
import { Note, Folder } from '../types';
import { parseNoteLinks } from '../utils/noteLinks';

interface NoteEditorProps {
  note: Note | null;
  folders: Folder[];
  onUpdate: (id: number, title: string, content: string, folderId?: number | null) => Promise<Note>;
  onDelete: (id: number) => void;
  onLinkClick: (linkName: string, noteId: number, title: string, content: string, folderId: number | null) => Promise<void>;
  allNotes: Note[];
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, folders, onUpdate, onDelete, onLinkClick, allNotes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<number | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolderId(note.folderId ?? null);
      setIsEditing(false);
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;
    try {
      await onUpdate(note.id, title, content, folderId);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleCancel = () => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolderId(note.folderId ?? null);
    }
    setIsEditing(false);
  };
  const handleFolderChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!note) return;
    const value = event.target.value;
    const nextFolderId = value ? parseInt(value, 10) : null;
    if ((note.folderId ?? null) === nextFolderId) {
      setFolderId(nextFolderId);
      return;
    }
    setFolderId(nextFolderId);
    try {
      await onUpdate(note.id, note.title, note.content, nextFolderId);
    } catch (err) {
      console.error('Failed to move note:', err);
      setFolderId(note.folderId ?? null);
    }
  };


  const handleDelete = () => {
    if (!note) return;
    onDelete(note.id);
  };

  const handleLinkClick = async (e: React.MouseEvent<HTMLSpanElement>, linkName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (note) {
      // Use current state (title, content, folderId) which may have unsaved changes
      await onLinkClick(linkName, note.id, title, content, folderId);
    }
  };

  const renderNoteContent = () => {
    if (!note) return null;
    
    const segments = parseNoteLinks(note.content);
    
    return segments.map((segment, index) => {
      if (segment.type === 'link') {
        // Check if the linked note exists
        const linkedNoteExists = allNotes.some(
          (n) => n.title.toLowerCase() === segment.linkName?.toLowerCase()
        );
        
        return (
          <span
            key={index}
            onClick={(e) => handleLinkClick(e, segment.linkName!)}
            className="cursor-pointer text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
            title={linkedNoteExists ? `Open "${segment.linkName}"` : `Create and open "${segment.linkName}"`}
          >
            {segment.content}
          </span>
        );
      }
      
      return <span key={index}>{segment.content}</span>;
    });
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
      <div className="bg-white border-b border-gray-200 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <FolderIcon className="w-4 h-4 text-gray-500" />
            <select
              value={folderId ?? ''}
              onChange={handleFolderChange}
              className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.title}
                </option>
              ))}
            </select>
          </label>
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
              {note.content ? renderNoteContent() : 'No content'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};