import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, History, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAIChat } from '../../hooks/useAIChat';

// Chat Message Component
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-300'}
      `}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      {/* Message Bubble */}
      <div className={`
        max-w-[75%] px-3.5 py-2.5 rounded-lg
        ${isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100'}
      `}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-400 dark:text-neutral-500'}`}>
          {new Date(message.createdAt?.endsWith?.('Z') ? message.createdAt : message.createdAt + 'Z').toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// Typing Indicator
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-300">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-gray-100 dark:bg-neutral-800 px-3.5 py-3 rounded-lg">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Chat Input Component
function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className="
          flex-1 resize-none
          px-3 py-2.5 rounded-lg
          bg-white dark:bg-neutral-800
          text-gray-900 dark:text-neutral-100
          placeholder-gray-400 dark:placeholder-neutral-500
          border border-gray-200 dark:border-neutral-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50
          text-sm
        "
        style={{ maxHeight: '120px' }}
      />
      <button
        type="submit"
        disabled={!input.trim() || disabled}
        className="
          p-2.5 rounded-lg
          bg-blue-600 hover:bg-blue-700
          text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {disabled ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  );
}

// History Dropdown
function HistoryDropdown({ isOpen, onClose, sessions, onSelect, onDelete, currentSessionId }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" onClick={onClose} />
      
      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 w-72 max-h-80 overflow-y-auto z-20 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
            No chat history yet
          </div>
        ) : (
          <div className="py-2">
            {sessions.map(session => (
              <div
                key={session.sessionId}
                className={`
                  flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer
                  ${currentSessionId === session.sessionId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <div 
                  className="flex-1 min-w-0"
                  onClick={() => {
                    onSelect(session.sessionId);
                    onClose();
                  }}
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-neutral-100 truncate">
                    {session.firstMessage || 'New conversation'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    {new Date(session.lastMessageAt?.endsWith?.('Z') ? session.lastMessageAt : session.lastMessageAt + 'Z').toLocaleDateString()} · {session.messageCount} messages
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.sessionId);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// Main Chat Window Component
export default function ChatWindow() {
  const {
    isOpen,
    closeChat,
    messages,
    sessions,
    currentSessionId,
    isLoading,
    error,
    sendMessage,
    newChat,
    loadSessions,
    loadSession,
    deleteSession,
    setError
  } = useAIChat();

  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sessions when opening history
  useEffect(() => {
    if (showHistory) {
      loadSessions();
    }
  }, [showHistory, loadSessions]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {/* Chat Window */}
      <div className="
        w-[360px] md:w-[400px]
        h-[500px] md:h-[550px]
        bg-white dark:bg-neutral-900
        rounded-lg
        shadow-xl
        flex flex-col
        animate-slide-up
        border border-gray-200 dark:border-neutral-800
      ">
        {/* Header */}
        <div className="
          flex items-center justify-between
          px-4 py-3
          bg-white dark:bg-neutral-900
          border-b border-gray-200 dark:border-neutral-800
          rounded-t-lg
        ">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">MentorEdu Chatbot</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            {/* New Chat Button */}
            <button
              onClick={newChat}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              title="New conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            {/* History Button */}
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-md transition-colors ${showHistory ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                title="Chat history"
              >
                <History className="w-5 h-5" />
              </button>
              
              <HistoryDropdown
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                sessions={sessions}
                onSelect={loadSession}
                onDelete={deleteSession}
                currentSessionId={currentSessionId}
              />
            </div>
            
            {/* Close Button */}
            <button
              onClick={closeChat}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-neutral-100 mb-1">
                Hi! I'm AI Assistant
              </h4>
              <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-xs">
                I can help you learn about MentorEdu, find the right mentor, or answer other questions.
              </p>
            </div>
          ) : (
            <>
              {messages.filter(Boolean).map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t border-gray-200 dark:border-neutral-800">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
