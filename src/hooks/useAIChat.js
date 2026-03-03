import { useContext } from 'react';
import AIChatContext from '../context/AIChatContext';

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}
