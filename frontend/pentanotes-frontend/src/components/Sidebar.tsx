import React from 'react';
import { Search, Plus, User, LogOut } from 'lucide-react';
import { Note, User as UserType } from '../types';

interface SidebarProps {
  user: UserType | null;
  notes: Note[];
  selectedNote: Note | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNoteSelect: (note: Note) => void;
  onCreateNote: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  notes = [],
  selectedNote,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onCreateNote,
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
        {filteredNotes.length === 0 ? (
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
