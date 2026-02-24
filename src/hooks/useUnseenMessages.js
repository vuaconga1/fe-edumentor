import { useState, useEffect } from 'react';
import chatApi from '../api/chatApi';
import groupApi from '../api/groupApi';

export default function useUnseenMessages() {
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const fetchUnseenCounts = async () => {
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
    };

    fetchUnseenCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnseenCounts, 30000);

    return () => clearInterval(interval);
  }, []);

  return unseenCount;
}
