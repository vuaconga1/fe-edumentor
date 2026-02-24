import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, History, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';

// Chat Message Component
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser 
          ? 'bg-indigo-600 text-white' 
          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}
      `}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      {/* Message Bubble */}
      <div className={`
        max-w-[75%] px-4 py-2.5 rounded-2xl
        ${isUser 
          ? 'bg-indigo-600 text-white rounded-br-md' 
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-md'}
      `}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-neutral-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// Typing Indicator
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-bl-md">
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
        placeholder="Nhập tin nhắn..."
        disabled={disabled}
        rows={1}
        className="
          flex-1 resize-none
          px-4 py-2.5 rounded-xl
          bg-neutral-100 dark:bg-neutral-800
          text-neutral-900 dark:text-neutral-100
          placeholder-neutral-400 dark:placeholder-neutral-500
          border border-neutral-200 dark:border-neutral-700
          focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
          disabled:opacity-50
          text-sm
        "
        style={{ maxHeight: '120px' }}
      />
      <button
        type="submit"
        disabled={!input.trim() || disabled}
        className="
          p-2.5 rounded-xl
          bg-indigo-600 hover:bg-indigo-700
          dark:bg-indigo-500 dark:hover:bg-indigo-600
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
      <div className="absolute top-full right-0 mt-2 w-72 max-h-80 overflow-y-auto z-20 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
            Chưa có lịch sử chat
          </div>
        ) : (
          <div className="py-2">
            {sessions.map(session => (
              <div
                key={session.sessionId}
                className={`
                  flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer
                  ${currentSessionId === session.sessionId ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}
                `}
              >
                <div 
                  className="flex-1 min-w-0"
                  onClick={() => {
                    onSelect(session.sessionId);
                    onClose();
                  }}
                >
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {session.firstMessage || 'Cuộc hội thoại mới'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(session.lastMessageAt).toLocaleDateString('vi-VN')} · {session.messageCount} tin nhắn
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.sessionId);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
        rounded-2xl
        shadow-2xl
        flex flex-col
        animate-slide-up
        border border-neutral-200 dark:border-neutral-700
      ">
        {/* Header */}
        <div className="
          flex items-center justify-between
          px-4 py-3
          bg-gradient-to-r from-indigo-600 to-blue-600
          rounded-t-2xl
        ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-indigo-200">MentorEdu Chatbot</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* New Chat Button */}
            <button
              onClick={newChat}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Cuộc hội thoại mới"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            {/* History Button */}
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'text-white bg-white/20' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                title="Lịch sử chat"
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
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                <Bot className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Xin chào! Tôi là AI Assistant
              </h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
                Tôi có thể giúp bạn tìm hiểu về nền tảng MentorEdu, tìm mentor phù hợp, hoặc trả lời các câu hỏi khác.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:underline mt-1"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-center">
            Nhấn Enter để gửi, Shift+Enter để xuống dòng
          </p>
        </div>
      </div>
    </div>
  );
}
