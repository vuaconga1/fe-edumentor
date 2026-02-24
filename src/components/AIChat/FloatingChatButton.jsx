import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';

export default function FloatingChatButton() {
  const { toggleChat, isOpen } = useAIChat();
  
  // Position state - start at bottom right
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('ai-chat-button-position');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);
  const hasMoved = useRef(false);

  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ai-chat-button-position', JSON.stringify(position));
  }, [position]);

  // Mouse/Touch event handlers for dragging
  const handleDragStart = (e) => {
    if (e.type === 'mousedown') {
      e.preventDefault();
    }
    
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    
    setIsDragging(true);
    hasMoved.current = false;
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Check if actually moved (to distinguish from click)
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      hasMoved.current = true;
    }
    
    // Boundary checks
    const buttonSize = 64; // w-16 = 64px
    const padding = 24; // Keep some padding from edges
    const maxX = window.innerWidth - buttonSize - padding - 24; // 24 for right-6
    const maxY = window.innerHeight - buttonSize - padding - 24; // 24 for bottom-6
    const minX = -window.innerWidth + buttonSize + padding + 24;
    const minY = -window.innerHeight + buttonSize + padding + 24;
    
    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    // Only toggle if we didn't drag
    if (!hasMoved.current) {
      toggleChat();
    }
    hasMoved.current = false;
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragStart]);

  // When chat is open, show as a simple close button (no dragging)
  if (isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-indigo-600 to-blue-600
          hover:from-indigo-700 hover:to-blue-700
          dark:from-indigo-500 dark:to-blue-500
          text-white shadow-2xl
          flex items-center justify-center
          transition-all duration-200
          hover:scale-105
        "
        aria-label="Close AI Chat"
      >
        <X className="w-6 h-6" />
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onClick={handleClick}
      className={`
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-gradient-to-br from-indigo-600 to-blue-600
        hover:from-indigo-700 hover:to-blue-700
        dark:from-indigo-500 dark:to-blue-500
        dark:hover:from-indigo-600 dark:hover:to-blue-600
        text-white shadow-2xl
        flex items-center justify-center
        transition-all duration-200
        ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'}
        select-none
      `}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      aria-label="Open AI Chat"
    >
      <MessageCircle className="w-6 h-6" />
      
      {/* Pulse animation */}
      <span className="absolute w-full h-full rounded-full bg-indigo-400 dark:bg-indigo-300 animate-ping opacity-30" />
    </button>
  );
}
