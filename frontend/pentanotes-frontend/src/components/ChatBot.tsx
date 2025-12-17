import React, { useState, useRef, useEffect } from 'react';
import { User, Note } from '../types';
import { RotateCcw } from 'lucide-react';
import { apiService } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  requestId?: string; // Store requestId for bot messages for revert functionality
}

interface ChatBotProps {
  user: User;
  onNotesChanged?: () => Promise<void>;
  onFoldersChanged?: () => Promise<void>;
  selectedNoteId?: number;
  onSelectedNoteUpdated?: (note: Note) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({
  user,
  onNotesChanged,
  onFoldersChanged,
  selectedNoteId,
  onSelectedNoteUpdated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRevertLastAction = async () => {
    // Extra safety check - don't allow if there's no requestId
    if (!lastRequestId || !user.id || isReverting || isLoading) return;

    setIsReverting(true);

    try {
      const response = await apiService.revertAiRequest(lastRequestId, user.id);

      // Add revert notification message
      const operationsCount = response.data?.operationsReverted ?? 0;
      const revertMessage: Message = {
        id: `revert-${Date.now()}`,
        text: `✓ Successfully reverted ${operationsCount} action(s)`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, revertMessage]);
      // Clear the request ID so button disappears
      setLastRequestId(null);

      // Refresh notes and folders after revert
      if (onNotesChanged) {
        await onNotesChanged();
        // After refreshing the notes list, if a note is currently selected,
        // try to refresh its content. If it was deleted, the note will no longer
        // be in the list and the parent component should handle deselection
        if (selectedNoteId && onSelectedNoteUpdated) {
          try {
            const updatedNote = await apiService.getNoteById(selectedNoteId);
            onSelectedNoteUpdated(updatedNote);
          } catch (err) {
            // Note was deleted during revert - the parent component should have
            // already deselected it through the onNotesChanged callback
            console.log('Selected note no longer exists after revert');
          }
        }
      }
      if (onFoldersChanged) {
        await onFoldersChanged();
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `revert-error-${Date.now()}`,
        text: `Failed to revert: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      console.error('Revert error:', error);
    } finally {
      setIsReverting(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    // Check if user.id exists
    if (!user.id) {
      console.error('User ID is not available');
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, user information is not available. Please try logging in again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call MCP API with guaranteed user.id
      const response = await apiService.sendMcpMessage(trimmedMessage, user.id);
      
      // Add bot response - extract from data field
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: response.data || response.message || 'No response from server',
        sender: 'bot',
        timestamp: new Date(),
        requestId: response.requestId, // Store requestId for potential revert
      };

      setMessages((prev) => [...prev, botMessage]);

      // Store the last request ID for revert functionality
      // Only set if there's an actual request ID AND actual changes were made
      // The UNDO button should only appear if the AI actually performed actions
      if (response.requestId && response.changed && response.changed.length > 0) {
        setLastRequestId(response.requestId);
      } else {
        setLastRequestId(null);
      }

      // Handle data refresh based on changed field
      if (response.changed && Array.isArray(response.changed)) {
        if (response.changed.includes('notes') && onNotesChanged) {
          await onNotesChanged();
          // If a note is currently selected, refresh it
          if (selectedNoteId && onSelectedNoteUpdated) {
            try {
              const updatedNote = await apiService.getNoteById(selectedNoteId);
              onSelectedNoteUpdated(updatedNote);
            } catch (err) {
              console.error('Failed to refresh selected note:', err);
            }
          }
        }
        if (response.changed.includes('folders') && onFoldersChanged) {
          await onFoldersChanged();
        }
      }
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      console.error('MCP API error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {lastRequestId && (
                <button
                  onClick={handleRevertLastAction}
                  disabled={isReverting || isLoading}
                  title="Undo last AI action"
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-200 font-medium text-sm ${
                    isReverting
                      ? 'bg-white/20 text-white cursor-not-allowed opacity-60'
                      : 'bg-white/30 text-white hover:bg-white/40 active:bg-white/50 hover:shadow-md'
                  }`}
                  aria-label="Revert last action"
                >
                  <RotateCcw className={`w-4 h-4 ${isReverting ? 'animate-spin' : ''}`} />
                  <span>Undo</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-sm">Start a conversation with your AI assistant!</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full px-4 py-2 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};