import { useState, useEffect, useCallback } from 'react';
import chatApi from '../api/chatApi';
import groupApi from '../api/groupApi';
import { on } from '../signalr/chatHub';

// Custom event name for triggering unseen count refresh
export const UNSEEN_COUNT_REFRESH_EVENT = 'unseen-messages-refresh';

// Helper function to trigger refresh from anywhere
export function refreshUnseenCount() {
  window.dispatchEvent(new CustomEvent(UNSEEN_COUNT_REFRESH_EVENT));
}

export default function useUnseenMessages() {
  const [unseenCount, setUnseenCount] = useState(0);

  const fetchUnseenCounts = useCallback(async () => {
    try {
      // Fetch conversations
      const convRes = await chatApi.getConversations();
      const conversations = convRes?.data?.data ?? [];
      const convUnseen = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

      // Fetch groups
      const groupRes = await groupApi.getMyGroups();
      const groups = groupRes?.data?.data ?? [];
      const groupUnseen = groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0);

      setUnseenCount(convUnseen + groupUnseen);
    } catch (error) {
      console.error('Failed to fetch unseen counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnseenCounts();

    // Refresh every 30 seconds as fallback
    const interval = setInterval(fetchUnseenCounts, 30000);

    // Listen for manual refresh events
    const handleRefresh = () => fetchUnseenCounts();
    window.addEventListener(UNSEEN_COUNT_REFRESH_EVENT, handleRefresh);

    // Real-time: update badge immediately when a new 1:1 message arrives (sent to this user only)
    const cleanupNewMsg = on('NewMessageNotification', () => {
      setUnseenCount(prev => prev + 1);
    });

    // Real-time: refetch when a group message arrives
    // (ReceiveGroupMessage fires for all members; refetch to get accurate count)
    const cleanupGroupMsg = on('ReceiveGroupMessage', () => {
      fetchUnseenCounts();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener(UNSEEN_COUNT_REFRESH_EVENT, handleRefresh);
      cleanupNewMsg();
      cleanupGroupMsg();
    };
  }, [fetchUnseenCounts]);

  return unseenCount;
}
