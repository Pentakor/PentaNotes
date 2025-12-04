import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotes } from './hooks/useNotes';
import { useFolders } from './hooks/useFolders';
import { useTags } from './hooks/useTags';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { Note } from './types';
import { Modal, ModalType } from './components/Modal';

type AppModal = {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: (value?: string) => Promise<void>;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
};

const App = () => {
  const { token, user, loading: authLoading, register, login, logout } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders(token);
  const { tags, loading: tagsLoading, refreshTags } = useTags(token);

  const selectedTagName = useMemo(() => {
    if (selectedTagId === null) {
      return null;
    }
    return tags.find((tag) => tag.id === selectedTagId)?.name ?? null;
  }, [selectedTagId, tags]);

  const { notes, allNotes, loading: notesLoading, createNote, updateNote, deleteNote } = useNotes(
    token,
    selectedFolderId,
    selectedTagName
  );
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<AppModal>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
  });

  const showModal = (modalData: Omit<AppModal, 'isOpen'>) => {
    setModal({ ...modalData, isOpen: true });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  // FIXED: Just set the note directly - it will render with the title from the API response
  const handleCreateNote = () => {
    showModal({
      type: 'prompt',
      title: 'New Note',
      message: 'Enter note title:',
      confirmText: 'Create',
      cancelText: 'Cancel',
      defaultValue: '',
      onConfirm: async (value) => {
        const noteTitle = value?.trim() || 'Untitled Note';
        try {
          const newNote = await createNote(noteTitle, selectedFolderId);
          // Just set it - the newNote already has the correct title from the API
          setSelectedNote(newNote);
        } catch (err) {
          showModal({
            type: 'error',
            title: 'Error',
            message: 'Failed to create note',
          });
        }
      },
    });
  };

  useEffect(() => {
    if (!token) {
      setSelectedTagId(null);
      return;
    }
    if (selectedTagId !== null && !tags.some((tag) => tag.id === selectedTagId)) {
      setSelectedTagId(null);
    }
  }, [selectedTagId, tags, token]);

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
    setSelectedTagId(null);
    setSelectedNote(null);
  };

  const handleTagSelect = (tagId: number | null) => {
    setSelectedTagId(tagId);
    if (tagId !== null) {
      setSelectedFolderId(null);
    }
    setSelectedNote(null);
  };

  const normalizeTagName = (value: string) => value.replace(/^#/, '').trim().toLowerCase();

  const handleTagFocus = async (tagName: string) => {
    const normalized = normalizeTagName(tagName);
    if (!normalized) {
      return;
    }
    const findTagByName = (collection: typeof tags) =>
      collection.find((tag) => tag.name.toLowerCase() === normalized);

    let targetTag = findTagByName(tags);
    if (!targetTag) {
      const refreshed = await refreshTags();
      targetTag = findTagByName(refreshed);
    }
    if (targetTag) {
      setSelectedTagId(targetTag.id);
      setSelectedFolderId(null);
    }
  };

  const handleCreateFolder = () => {
    showModal({
      type: 'prompt',
      title: 'New Folder',
      message: 'Enter folder name:',
      confirmText: 'Create',
      cancelText: 'Cancel',
      defaultValue: '',
      onConfirm: async (value) => {
        const folderTitle = value?.trim();
        if (!folderTitle) {
          return;
        }
        try {
          const folder = await createFolder(folderTitle);
          setSelectedFolderId(folder.id);
          setSelectedTagId(null);
          setSelectedNote(null);
        } catch (err) {
          showModal({
            type: 'error',
            title: 'Error',
            message: 'Failed to create folder',
          });
        }
      },
    });
  };

  const handleRenameFolder = (folderId: number) => {
    const folder = folders.find((f) => f.id === folderId);
    showModal({
      type: 'prompt',
      title: 'Rename Folder',
      message: 'Update folder name:',
      confirmText: 'Save',
      cancelText: 'Cancel',
      defaultValue: folder?.title || '',
      onConfirm: async (value) => {
        const folderTitle = value?.trim();
        if (!folderTitle || folderTitle === folder?.title) {
          return;
        }
        try {
          await updateFolder(folderId, { title: folderTitle });
        } catch (err) {
          showModal({
            type: 'error',
            title: 'Error',
            message: 'Failed to rename folder',
          });
        }
      },
    });
  };

  const handleDeleteFolder = (folderId: number) => {
    const folder = folders.find((f) => f.id === folderId);
    showModal({
      type: 'confirm',
      title: 'Delete Folder',
      message: `Delete "${folder?.title || 'folder'}"? Notes remain accessible from All Notes.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteFolder(folderId);
          if (selectedFolderId === folderId) {
            setSelectedFolderId(null);
          }
        } catch (err) {
          showModal({
            type: 'error',
            title: 'Error',
            message: 'Failed to delete folder',
          });
        }
      },
    });
  };

  const handleDeleteNote = (id: number) => {
    showModal({
      type: 'confirm',
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteNote(id);
          if (selectedNote?.id === id) {
            setSelectedNote(null);
          }
          await refreshTags();
        } catch (err) {
          showModal({
            type: 'error',
            title: 'Error',
            message: 'Failed to delete note',
          });
        }
      },
    });
  };

  const handleUpdateNote = async (
    id: number,
    title: string,
    content: string,
    folderId?: number | null
  ) => {
    try {
      const updatedNote = await updateNote(id, title, content, folderId);
      // Update the selected note with the response from the API
      if (selectedFolderId && updatedNote.folderId !== selectedFolderId) {
        setSelectedNote(null);
      } else {
        setSelectedNote(updatedNote);
      }
      await refreshTags();
      return updatedNote;
    } catch (err) {
      showModal({
        type: 'error',
        title: 'Error',
        message: 'Failed to save note',
      });
      throw err;
    }
  };

  // Find or create a note by title
  const findOrCreateNoteByTitle = async (noteTitle: string): Promise<Note> => {
    try {
      // Get all notes to search for existing one
      const existingNote = allNotes.find((n) => n.title.toLowerCase() === noteTitle.toLowerCase());
      
      if (existingNote) {
        return existingNote;
      }
      
      // Create new note if it doesn't exist
      return await createNote(noteTitle, null);
    } catch (err) {
      console.error('Failed to find or create note:', err);
      throw err;
    }
  };

  // Handle link click - save current note and navigate to linked note
  const handleLinkClick = async (
    linkName: string,
    noteId: number,
    title: string,
    content: string,
    folderId: number | null
  ) => {
    try {
      // First, save the current note with its current state
      await handleUpdateNote(noteId, title, content, folderId);
      
      // Find or create the linked note
      const targetNote = await findOrCreateNoteByTitle(linkName);
      
      // Open the target note
      setSelectedNote(targetNote);
    } catch (err) {
      showModal({
        type: 'error',
        title: 'Error',
        message: 'Failed to open linked note',
      });
    }
  };

  // Show login page if no token or no user (invalid token)
  // But wait if we're still loading the profile
  if (!token) {
    return <LoginPage onLogin={login} onRegister={register} loading={authLoading} />;
  }

  // If we have a token but no user and we're done loading, token is invalid
  if (token && !user && !authLoading) {
    return <LoginPage onLogin={login} onRegister={register} loading={false} />;
  }

  // If we're still loading the profile, show a loading state
  if (token && !user && authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        user={user}
        notes={notes}
        notesLoading={notesLoading}
        folders={folders}
        tags={tags}
        selectedFolderId={selectedFolderId}
        selectedTagId={selectedTagId}
        selectedNote={selectedNote}
        tagsLoading={tagsLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNoteSelect={setSelectedNote}
        onFolderSelect={handleFolderSelect}
        onTagSelect={handleTagSelect}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onCreateNote={handleCreateNote}
        onLogout={logout}
      />
      <NoteEditor
        note={selectedNote}
        folders={folders}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
        onLinkClick={handleLinkClick}
        onTagClick={handleTagFocus}
        allNotes={allNotes}
      />

      {/* Global Modal */}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        defaultValue={modal.defaultValue}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
};

export default App;