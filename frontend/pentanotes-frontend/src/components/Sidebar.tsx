import React from 'react';
import { Search, Plus, User, LogOut, FolderPlus, Folder as FolderIcon, Edit2, Trash2 } from 'lucide-react';
import { Note, Folder, Tag, User as UserType } from '../types';

interface SidebarProps {
  user: UserType | null;
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  selectedNote: Note | null;
  selectedFolderId: number | null;
  selectedTagId: number | null;
  searchQuery: string;
  notesLoading?: boolean;
  tagsLoading?: boolean;
  onSearchChange: (query: string) => void;
  onNoteSelect: (note: Note) => void;
  onFolderSelect: (folderId: number | null) => void;
  onTagSelect: (tagId: number | null) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onRenameFolder: (folderId: number) => void;
  onDeleteFolder: (folderId: number) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  notes = [],
  folders = [],
  tags = [],
  selectedNote,
  selectedFolderId,
  selectedTagId,
  searchQuery,
  notesLoading = false,
  tagsLoading = false,
  onSearchChange,
  onNoteSelect,
  onFolderSelect,
  onTagSelect,
  onCreateNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onLogout,
}) => {
  const filteredNotes = notes.filter((note) => {
    const title = note.title || '';
    const content = note.content || '';
    const query = searchQuery || '';
    return (
      title.toLowerCase().includes(query.toLowerCase()) ||
      content.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            PentaNotes
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{user?.name || 'Guest'}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Folder Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Folders</p>
          <button
            onClick={onCreateFolder}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onFolderSelect(null)}
            className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
              selectedFolderId === null
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FolderIcon className="w-4 h-4" />
            All Notes
          </button>
          {folders.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">No folders yet</p>
          ) : (
            folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => onFolderSelect(folder.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FolderIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm">{folder.title}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameFolder(folder.id);
                    }}
                    className="p-1 rounded hover:bg-white/60"
                    title="Rename folder"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFolder(folder.id);
                    }}
                    className="p-1 rounded hover:bg-white/60 text-red-500"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tag Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Tags</p>
          {tagsLoading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        {tags.length === 0 && !tagsLoading ? (
          <p className="text-xs text-gray-400 px-3 py-2">No tags yet</p>
        ) : (
          <div className="space-y-1">
            <button
              onClick={() => onTagSelect(null)}
              className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                selectedTagId === null
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-700 hover:bg-green-50/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              All Tags
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagSelect(tag.id)}
                className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors ${
                  selectedTagId === tag.id
                    ? 'bg-green-100 text-green-800 font-semibold border border-green-200'
                    : 'text-gray-700 hover:bg-green-50/80'
                }`}
              >
                <span className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="truncate">#{tag.name}</span>
                </span>
                <span className="text-xs text-gray-500">{tag.noteCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Note Button */}
      <div className="p-4">
        <button
          onClick={onCreateNote}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {notesLoading ? (
          <div className="p-4 text-center text-gray-500">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {notes.length === 0 ? 'No notes yet. Create one!' : 'No matching notes'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onNoteSelect(note)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedNote?.id === note.id
                  ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{note.title || 'Untitled Note'}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{note.content || 'No content'}</p>
              <p className="text-xs text-gray-400 mt-2">
                {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
