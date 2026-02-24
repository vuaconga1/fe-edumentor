import { createContext, useContext, useState, useCallback } from 'react';
import aiChatApi from '../api/aiChatApi';

const AIChatContext = createContext(null);

export function AIChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Open chat window
  const openChat = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  // Close chat window
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Toggle chat window
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    setError(null);
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately for optimistic UI
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const res = await aiChatApi.sendMessage(content.trim(), currentSessionId);
      const data = res.data;

      // Update session ID if new
      if (!currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }

      // Replace temp message with actual and add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMessage.id);
        return [...filtered, data.userMessage, data.aiMessage];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, isLoading]);

  // Start a new chat session
  const newChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
  }, []);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await aiChatApi.getSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  }, []);

  // Load a specific session's messages
  const loadSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiChatApi.getSessionHistory(sessionId);
      setMessages(res.data.messages || []);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Không thể tải lịch sử chat.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      await aiChatApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      // If current session was deleted, start new chat
      if (currentSessionId === sessionId) {
        newChat();
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Không thể xóa cuộc hội thoại.');
    }
  }, [currentSessionId, newChat]);

  return (
    <AIChatContext.Provider value={{
      isOpen,
      messages,
      sessions,
      currentSessionId,
      isLoading,
      error,
      openChat,
      closeChat,
      toggleChat,
      sendMessage,
      newChat,
      loadSessions,
      loadSession,
      deleteSession,
      setError
    }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}

export default AIChatContext;
