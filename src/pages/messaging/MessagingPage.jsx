import React, { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import ConversationList from "../../components/messaging/ConversationList";
import ChatWindow from "../../components/messaging/ChatWindow";
import chatApi from "../../api/chatApi";
import { jwtDecode } from "jwt-decode";

import {
  startChatHub,
  joinConversation,
  leaveConversation,
  on,
  sendMessage as hubSendMessage,
} from "../../signalr/chatHub";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const prevConversationIdRef = useRef(null);

  const token = localStorage.getItem("token");

  // decode userId from token (khỏi cần /profile)
  useEffect(() => {
    if (!token) return;
    try {
      const payload = jwtDecode(token);
      const id =
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        payload.sub;
      setCurrentUserId(id ? Number(id) : null);
    } catch (e) {
      console.error("Decode token failed", e);
      setCurrentUserId(null);
    }
  }, [token]);

  // 1) load conversations
  useEffect(() => {
    (async () => {
      try {
        const res = await chatApi.getConversations();
        setConversations(res.data?.data ?? []);
      } catch (e) {
        console.error("Load conversations failed", e);
        setConversations([]);
      }
    })();
  }, []);

  // 2) start hub 1 lần + listen ReceiveMessage
  useEffect(() => {
    if (!token) return;

    let offReceive;

    (async () => {
      await startChatHub(BASE_URL, token);

      offReceive = on("ReceiveMessage", (msg) => {
        // ✅ chỉ add nếu đúng room đang mở
        if ((msg.conversationId ?? msg.conversationID) !== activeConversationId) return;

        setMessages(prev => Array.isArray(prev) ? [...prev, msg] : [msg]);
      });
    })();

    return () => offReceive?.();
  }, [token, activeConversationId]);


  // 3) switch conversation: leave old -> load history -> join room
  useEffect(() => {
    if (!activeConversationId) return;

    const loadMessages = async () => {
      try {
        const res = await chatApi.getMessages(activeConversationId);
        const data = res?.data?.data;

        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.items)) list = data.items;
        else if (Array.isArray(data?.messages)) list = data.messages;

        setMessages(list);

      } catch (err) {
        console.log("Load messages failed", err);
      }
    };

    loadMessages();
  }, [activeConversationId]);


  const activeConversation = conversations.find(
    (c) => (c.conversationId ?? c.id) === activeConversationId
  );

  const handleSend = async (text) => {
    if (!activeConversationId) return;

    // ✅ hiện liền (optimistic)
    const temp = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      content: text,
      isOwn: true,
      senderName: "You",
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => Array.isArray(prev) ? [...prev, temp] : [temp]);

    // gửi lên server
    await hubSendMessage({
      conversationId: activeConversationId,
      content: text,
      messageType: 0,
    });
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex bg-neutral-50 dark:bg-neutral-950">
      {/* LEFT: conversations */}
      <div className="w-[340px] border-r border-neutral-200 dark:border-neutral-800">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />
      </div>

      {/* RIGHT: chat */}
      <div className="flex-1 min-w-0">
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          onSend={handleSend}
          currentUserId={currentUserId}
        />
      </div>

      {/* Mobile overlay */}
      {activeConversation && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 md:hidden flex flex-col animate-in slide-in-from-right-full duration-300">
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            currentUserId={currentUserId}
            onSend={handleSend}
            onBack={() => setActiveConversationId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
