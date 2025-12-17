import React, { useState, useEffect, useMemo } from 'react';
import { Edit2, Save, X, Trash2, Search, Folder as FolderIcon, Info } from 'lucide-react';
import { Note, Folder } from '../types';
import { parseNoteLinks } from '../utils/noteLinks';
import { apiService } from '../services/api';

interface NoteEditorProps {
  note: Note | null;
  folders: Folder[];
  onUpdate: (id: number, title: string, content: string, folderId?: number | null | 'ALL Notes') => Promise<Note>;
  onDelete: (id: number) => void;
  onLinkClick: (linkName: string, noteId: number, title: string, content: string, folderId: number | null | 'ALL Notes') => Promise<void>;
  onTagClick?: (tagName: string) => void;
  allNotes: Note[];
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  onUpdate,
  onDelete,
  onLinkClick,
  onTagClick,
  allNotes,
}) => {
  const [showMeta, setShowMeta] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaData, setMetaData] = useState<Note | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<number | null>(null);
  const metaSource = metaData ?? note;
  const noteTitleMap = useMemo(() => {
    const map = new Map<number, string>();
    allNotes.forEach((n) => map.set(n.id, n.title || `Note ${n.id}`));
    return map;
  }, [allNotes]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setFolderId(note.folderId ?? null);
      setIsEditing(false);
    } else {
      setTitle('');
      setContent('');
      setFolderId(null);
    }
    setShowMeta(false);
    setMetaData(null);
    setMetaError(null);
    setMetaLoading(false);
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
    // Convert to folder ID (number) or null for no folder
    const nextFolderId: number | null = value ? parseInt(value, 10) : null;
    
    // Compare with current note's folderId
    const currentFolderId: number | null = note.folderId ?? null;
    if (currentFolderId === nextFolderId) {
      setFolderId(nextFolderId);
      return;
    }
    setFolderId(nextFolderId);
    try {
      await onUpdate(note.id, title, content, nextFolderId);
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

  const handleMetaToggle = async () => {
    if (!note) return;
    const nextState = !showMeta;
    setShowMeta(nextState);
    if (!nextState) {
      setMetaData(null);
      setMetaError(null);
      setMetaLoading(false);
      return;
    }

    setMetaLoading(true);
    setMetaError(null);
    try {
      const details = await apiService.getNoteById(note.id);
      setMetaData(details);
    } catch (err) {
      console.error('Failed to load note metadata:', err);
      setMetaError('Failed to load note details');
    } finally {
      setMetaLoading(false);
    }
  };

  const formatNoteNames = (ids?: number[]) => {
    if (!ids || ids.length === 0) {
      return 'None';
    }
    return ids
      .map((id) => noteTitleMap.get(id) || `Note ${id}`)
      .join(', ');
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
            className={`cursor-pointer ${
              linkedNoteExists
                ? 'text-indigo-600 hover:text-indigo-800 hover:underline font-medium'
                : 'text-orange-600 hover:text-orange-800 hover:underline font-medium'
            }`}
            title={linkedNoteExists ? `Open "${segment.linkName}"` : `Create and open "${segment.linkName}"`}
          >
            {segment.content}
          </span>
        );
      }
      if (segment.type === 'tag') {
        return (
          <span
            key={index}
            onClick={() => segment.tagName && onTagClick?.(segment.tagName)}
            className="text-green-600 font-medium cursor-pointer hover:text-green-700"
            title={`Tag: #${segment.tagName}`}
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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{note.title}</h2>
              <button
                onClick={handleMetaToggle}
                aria-pressed={showMeta}
                title="View note info"
                className={`p-2 rounded-full border transition-colors ${
                  showMeta
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <FolderIcon className="w-4 h-4 text-gray-500" />
            <select
              value={folderId !== null ? folderId : ''}
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
{/* Metadata Panel */}
{showMeta && note && (
  <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 text-sm text-gray-700 space-y-2">
    {metaLoading && <p className="text-gray-500">Loading note info...</p>}
    {!metaLoading && metaError && <p className="text-red-600">{metaError}</p>}
    {!metaLoading && !metaError && metaSource && (
      <>
        <div><strong>Note ID:</strong> {metaSource.id}</div>

        <div>
          <strong>Folder:</strong>{' '}
          {folders.find((f) => f.id === metaSource.folderId)?.title ?? 'No folder'}
        </div>

        <div>
          <strong>Created:</strong>{' '}
          {new Date(metaSource.createdAt).toLocaleString()}
        </div>

        <div>
          <strong>Updated:</strong>{' '}
          {new Date(metaSource.updatedAt).toLocaleString()}
        </div>

        <div>
          <strong>Linked Notes:</strong>{' '}
          {metaSource.linkedNoteIds?.length ?? 0}
        </div>
        <div className="text-xs text-gray-500 break-words">
          {formatNoteNames(metaSource.linkedNoteIds)}
        </div>

        <div>
          <strong>Backlinks:</strong>{' '}
          {metaSource.backlinkNoteIds?.length ?? 0}
        </div>
        <div className="text-xs text-gray-500 break-words">
          {formatNoteNames(metaSource.backlinkNoteIds)}
        </div>
        <div>
          <strong>Tags:</strong>{' '}
          {metaSource.tagNames && metaSource.tagNames.length > 0 ? '' : 'None'}
        </div>
        {metaSource.tagNames && metaSource.tagNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {metaSource.tagNames.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </>
    )}
  </div>
)}

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