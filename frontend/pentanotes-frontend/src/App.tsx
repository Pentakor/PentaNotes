import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotes } from './hooks/useNotes';
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
  const { notes, createNote, updateNote, deleteNote } = useNotes(token);
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
          const newNote = await createNote(noteTitle);
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

  const handleUpdateNote = async (id: number, title: string, content: string) => {
    try {
      const updatedNote = await updateNote(id, title, content);
      // Update the selected note with the response from the API
      setSelectedNote(updatedNote);
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

  if (!token) {
    return <LoginPage onLogin={login} onRegister={register} loading={authLoading} />;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        user={user}
        notes={notes}
        selectedNote={selectedNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNoteSelect={setSelectedNote}
        onCreateNote={handleCreateNote}
        onLogout={logout}
      />
      <NoteEditor
        note={selectedNote}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
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