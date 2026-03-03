import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConversationList from "../../components/messaging/ConversationList";
import GroupList from "../../components/messaging/GroupList";
import ChatWindow from "../../components/messaging/ChatWindow";
import GroupChatWindow from "../../components/messaging/GroupChatWindow";
import chatApi from "../../api/chatApi";
import groupApi from "../../api/groupApi";
import fileApi from "../../api/fileApi";
import axiosClient from "../../api/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import WorkActionConfirmModal from "../../components/messaging/WorkActionConfirmModal";
import { refreshUnseenCount } from "../../hooks/useUnseenMessages";
import { useWorkSession } from "../../hooks/useWorkSession";
import { useMessagingSync } from "../../hooks/useMessagingSync";
import { useImageUpload } from "../../hooks/useImageUpload";

import {
  joinConversation,
  leaveConversation,
  getOnlineUsers,
  sendMessage as hubSendMessage,
  markAsRead,
  requestStartWork,
  requestPauseWork,
  requestEndWork,
  requestCompleteOrder,
  respondWorkAction,
  joinGroupRoom,
  leaveGroupRoom,
  sendGroupMessage as hubSendGroupMessage,
  markGroupAsRead,
  isConnected,
} from "../../signalr/chatHub";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// convert relative "/uploads/..." -> absolute "https://localhost:7082/uploads/..."
const toAbsolute = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// ===== small helper: format timer =====
const pad2 = (n) => String(n).padStart(2, "0");
const formatHMS = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(ss)}`;
};

const MessagingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const workActionPopupRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("conversations"); // "conversations" | "groups"
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null); // Full group object for chat window
  const [messages, setMessages] = useState([]);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(false);
  const [msgLoadingMore, setMsgLoadingMore] = useState(false);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupMsgPage, setGroupMsgPage] = useState(1);
  const [groupHasMore, setGroupHasMore] = useState(false);
  const [groupLoadingMore, setGroupLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName] = useState(null);

  const [hubReady, setHubReady] = useState(false);

  const activeConversationIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const prevConversationIdRef = useRef(null);
  const activeGroupIdRef = useRef(null);

  const hubStartedRef = useRef(false);

  const handleOrderCompleted = (completedConversationId) => {
    setConversations(prev =>
      (Array.isArray(prev) ? prev : []).map(c =>
        (c.conversationId ?? c.id) === Number(completedConversationId)
          ? { ...c, orderStatus: "Completed" }
          : c
      )
    );
  };

  const {
    workSession,
    setWorkSession,
    workActionPopup,
    pendingCompleteRequest,
    completingOrder,
    elapsedSeconds,
    setCompletingOrder,
    setPendingCompleteRequest,
    handleRespondWorkAction,
    resetWorkSessionState
  } = useWorkSession(activeConversationIdRef, handleOrderCompleted);

  const { handleSendImage, handleSendGroupImage } = useImageUpload({
    activeConversationId,
    activeGroupId,
    currentUserId,
    currentUserName,
    setMessages,
    setGroupMessages,
    setGroups
  });

  const token = localStorage.getItem("token");

  // decode userId from token
  useEffect(() => {
    if (!token) return;
    try {
      const payload = jwtDecode(token);
      const id =
        payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] || payload.sub;
      setCurrentUserId(id ? Number(id) : null);
    } catch (e) {
      console.error("Decode token failed", e);
      setCurrentUserId(null);
    }
  }, [token]);

  // load conversations and join all for realtime updates
  useEffect(() => {
    (async () => {
      try {
        const res = await chatApi.getConversations();
        const conversations = (res?.data?.data ?? []).map(c => {
          // Format lastMessage based on URL pattern
          const lastMsg = c.lastMessage ?? "";
          const isImageUrl = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(lastMsg);
          const isFileUrl = /^\/uploads\//i.test(lastMsg) || /^https?:\/\//i.test(lastMsg);

          let formattedLastMessage = lastMsg;
          if (isImageUrl) {
            formattedLastMessage = "Image";
          } else if (isFileUrl && !isImageUrl) {
            formattedLastMessage = "File";
          }

          return {
            ...c,
            lastMessage: formattedLastMessage
          };
        });
        setConversations(conversations);

        // KHÔNG join tất cả conversations ở đây vì server JoinConversation
        // sẽ gọi MarkMessagesAsReadAsync → đánh dấu TẤT CẢ tin nhắn đã đọc.
        // Chỉ join khi user click vào conversation cụ thể (trong useEffect activeConversationId).
      } catch (e) {
        console.error("Load conversations failed", e);
        setConversations([]);
      }
    })();
  }, [hubReady]); // Depend on hubReady to join after hub connected

  // ===== Auto-open conversation from URL param (e.g. from notification click) =====
  const urlConversationHandled = useRef(false);
  useEffect(() => {
    if (urlConversationHandled.current) return;
    const cid = searchParams.get("conversationId");
    if (!cid || conversations.length === 0) return;

    const numCid = Number(cid);
    const found = conversations.find(c => (c.conversationId ?? c.id) === numCid);
    if (found) {
      urlConversationHandled.current = true;
      setActiveTab("conversations");
      setActiveConversationId(numCid);
      setActiveGroupId(null);
      // Clean up URL param
      searchParams.delete("conversationId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [conversations, searchParams, setSearchParams]);

  // load groups
  useEffect(() => {
    (async () => {
      try {
        const res = await groupApi.getMyGroups();
        setGroups(res?.data?.data ?? []);
      } catch (e) {
        console.error("Load groups failed", e);
        setGroups([]);
      }
    })();
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const handleSelectConversation = (id) => {
    setActiveTab("conversations");
    setActiveConversationId(id);
    setActiveGroupId(null);

    // Reset unread count cho conversation này (optimistic)
    setConversations((prev) =>
      (Array.isArray(prev) ? prev : []).map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      )
    );

    // Call markAsRead on server to mark messages as read
    try {
      markAsRead(id);
      refreshUnseenCount(); // Update sidebar badge
    } catch (e) {
      console.error("markAsRead failed:", e);
    }

    // Leave any active group room
    if (activeGroupId) {
      try { leaveGroupRoom(activeGroupId); } catch (e) { console.error(e); }
    }
  };



  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);

  const handleSelectGroup = async (id) => {
    // Leave previous group room
    if (activeGroupId && activeGroupId !== id) {
      try { leaveGroupRoom(activeGroupId); } catch (e) { console.error(e); }
    }

    setActiveTab("groups");
    setActiveGroupId(id);
    setActiveConversationId(null);
    setGroupMessages([]);
    setGroupMsgPage(1);
    setGroupHasMore(false);

    // Reset unread count cho group này
    setGroups((prev) =>
      (Array.isArray(prev) ? prev : []).map((g) =>
        g.id === id ? { ...g, unreadCount: 0 } : g
      )
    );

    // Call markGroupAsRead on server to update LastReadAt
    try {
      markGroupAsRead(id);
      refreshUnseenCount(); // Update sidebar badge
    } catch (e) {
      console.error("markGroupAsRead failed:", e);
    }

    try {
      // Join SignalR group room for realtime messages
      await joinGroupRoom(id);

      // Load group details
      const groupRes = await groupApi.getGroup(id);
      if (groupRes?.data?.success) {
        setActiveGroup(groupRes.data.data);
      }

      // Load group messages (paginated - load recent first)
      const msgRes = await groupApi.getGroupMessages(id, { pageNumber: 1, pageSize: 20 });
      if (msgRes?.data?.success) {
        const responseData = msgRes.data.data;
        // Support both paginated response {messages, hasMore, ...} and flat array
        const rawMessages = responseData?.messages ?? responseData ?? [];
        setGroupHasMore(responseData?.hasMore ?? false);
        setGroupMsgPage(1);

        // Map messages và convert relative URL thành absolute
        const messages = (rawMessages).map(m => {
          const rawType = m.messageType;
          let type;
          if (typeof rawType === 'string') {
            if (rawType === 'Image') type = 2;
            else if (rawType === 'File') type = 1;
            else if (rawType === 'Text') type = 0;
            else if (rawType === 'System') type = 3;
            else type = Number(rawType) || 0;
          } else {
            type = Number(rawType ?? 0);
          }

          // Check if content looks like image URL (fallback for old messages)
          const content = String(m.content ?? "");
          const isUrl = /^\/uploads\//i.test(content) || /^https?:\/\//i.test(content);
          const hasImageExt = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(content);
          const isFileOrImage = type === 1 || type === 2 || (isUrl && hasImageExt);

          const mapped = {
            ...m,
            messageType: type,
            content: isFileOrImage ? toAbsolute(content) : content,
          };

          return mapped;
        });

        setGroupMessages(messages);
      }

      // Refresh groups list
      const res = await groupApi.getMyGroups();
      setGroups(res?.data?.data ?? []);
    } catch (e) {
      console.error("Load group failed", e);
    }
  };

  // ====== Load older conversation messages (infinite scroll) ======
  const handleLoadMoreMessages = async () => {
    if (!activeConversationId || msgLoadingMore || !msgHasMore) return;
    setMsgLoadingMore(true);
    try {
      const nextPage = msgPage + 1;
      const res = await chatApi.getMessages(activeConversationId, { pageNumber: nextPage, pageSize: 30 });
      const data = res?.data?.data;

      let list = [];
      let hasMore = false;

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.items)) {
        list = data.items;
        hasMore = data.hasMore ?? false;
      } else if (Array.isArray(data?.messages)) {
        list = data.messages;
        hasMore = data.hasMore ?? false;
      }

      const normalized = list.map((m) => {
        const senderId = Number(m.senderId ?? m.senderID ?? m.userId ?? m.userID);
        const type = Number(m.messageType ?? m.type ?? 0);
        return {
          ...m,
          senderId,
          messageType: type,
          isOwn: currentUserId != null && senderId === Number(currentUserId),
          content: type === 1 || type === 2 ? toAbsolute(m.content) : m.content,
        };
      });

      // Prepend older messages
      setMessages(prev => [...normalized, ...prev]);
      setMsgPage(nextPage);
      setMsgHasMore(hasMore);
    } catch (e) {
      console.error("Load more messages failed", e);
    } finally {
      setMsgLoadingMore(false);
    }
  };

  // ====== Load older group messages (infinite scroll) ======
  const handleLoadMoreGroupMessages = async () => {
    if (!activeGroupId || groupLoadingMore || !groupHasMore) return;
    setGroupLoadingMore(true);
    try {
      const nextPage = groupMsgPage + 1;
      const msgRes = await groupApi.getGroupMessages(activeGroupId, { pageNumber: nextPage, pageSize: 20 });
      if (msgRes?.data?.success) {
        const responseData = msgRes.data.data;
        const rawMessages = responseData?.messages ?? responseData ?? [];
        setGroupHasMore(responseData?.hasMore ?? false);
        setGroupMsgPage(nextPage);

        const olderMessages = rawMessages.map(m => {
          const rawType = m.messageType;
          let type;
          if (typeof rawType === 'string') {
            if (rawType === 'Image') type = 2;
            else if (rawType === 'File') type = 1;
            else if (rawType === 'Text') type = 0;
            else if (rawType === 'System') type = 3;
            else type = Number(rawType) || 0;
          } else {
            type = Number(rawType ?? 0);
          }
          const content = String(m.content ?? "");
          const isUrl = /^\/uploads\//i.test(content) || /^https?:\/\//i.test(content);
          const hasImageExt = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(content);
          const isFileOrImage = type === 1 || type === 2 || (isUrl && hasImageExt);
          return { ...m, messageType: type, content: isFileOrImage ? toAbsolute(content) : content };
        });

        // Prepend older messages
        setGroupMessages(prev => [...olderMessages, ...prev]);
      }
    } catch (e) {
      console.error("Load more group messages failed", e);
    } finally {
      setGroupLoadingMore(false);
    }
  };

  // ====== Leave group ======
  const handleLeaveGroup = async (groupId) => {
    try {
      await groupApi.leaveGroup(groupId);
      // Leave SignalR room
      try { leaveGroupRoom(groupId); } catch (e) { console.error(e); }
      // Remove from groups list
      setGroups(prev => (Array.isArray(prev) ? prev : []).filter(g => g.id !== groupId));
      // Reset active group
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
        setActiveGroup(null);
        setGroupMessages([]);
      }
      toast.success("Left group successfully!");
    } catch (e) {
      console.error("Leave group failed", e);
      toast.error("Failed to leave group!");
      throw e;
    }
  };

  const handleRefreshGroups = async () => {
    try {
      const res = await groupApi.getMyGroups();
      setGroups(res?.data?.data ?? []);

      // Refresh active group if selected
      if (activeGroupId) {
        const groupRes = await groupApi.getGroup(activeGroupId);
        if (groupRes?.data?.success) {
          setActiveGroup(groupRes.data.data);
        }
      }
    } catch (e) {
      console.error("Refresh groups failed", e);
    }
  };

  const handleKickMember = async (groupId, userId) => {
    try {
      await groupApi.removeMember(groupId, userId);
      toast.success("Member removed from group!");
      // Refresh active group to update member list
      const groupRes = await groupApi.getGroup(groupId);
      if (groupRes?.data?.success) {
        setActiveGroup(groupRes.data.data);
      }
    } catch (e) {
      console.error("Kick member failed", e);
      toast.error(e?.response?.data?.message || "Failed to remove member");
      throw e;
    }
  };

  const handleSendGroupMessage = async (content) => {
    if (!activeGroupId || !content.trim()) return;

    try {
      // Optimistic update for groups list
      setGroups((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((g) => {
          if (g.id === activeGroupId) {
            return {
              ...g,
              lastMessage: content.trim(),
              lastMessageAt: new Date().toISOString(),
              lastMessageSender: "You"
            };
          }
          return g;
        });
      });

      // Use SignalR for realtime messaging
      await hubSendGroupMessage({
        groupId: activeGroupId,
        content: content.trim(),
        messageType: 0 // Text
      });
      // Message will be added via ReceiveGroupMessage event
    } catch (e) {
      console.error("Send group message failed", e);
      toast.error("Failed to send message");
    }
  };



  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useMessagingSync({
    token,
    hubStartedRef,
    setHubReady,
    activeConversationIdRef,
    activeGroupIdRef,
    currentUserIdRef,
    setConversations,
    setMessages,
    setGroups,
    setGroupMessages,
    refreshUnseenCount
  });

  // ===== switch conversation: leave old -> load history -> join room (keep your logic) =====
  useEffect(() => {
    if (!activeConversationId) {
      const prev = prevConversationIdRef.current;
      if (prev) {
        leaveConversation(prev).catch(() => { });
        prevConversationIdRef.current = null;
      }
      setMessages([]);
      resetWorkSessionState();
      return;
    }

    (async () => {
      try {
        const prev = prevConversationIdRef.current;
        if (prev && prev !== activeConversationId) {
          await leaveConversation(prev);
        }

        // load history (paginated - support both flat array and paginated response)
        const res = await chatApi.getMessages(activeConversationId, { pageNumber: 1, pageSize: 30 });
        const data = res?.data?.data;

        let list = [];
        let hasMore = false;

        if (Array.isArray(data)) {
          list = data;
          // If API doesn't return hasMore, assume true if we got a full page
          hasMore = list.length >= 30;
        } else if (Array.isArray(data?.items)) {
          list = data.items;
          hasMore = data.hasMore ?? (list.length >= 30);
        } else if (Array.isArray(data?.messages)) {
          list = data.messages;
          hasMore = data.hasMore ?? (list.length >= 30);
        }

        const normalized = (Array.isArray(list) ? list : []).map((m) => {
          const senderId = Number(m.senderId ?? m.senderID ?? m.userId ?? m.userID);
          const type = Number(m.messageType ?? m.type ?? 0);
          return {
            ...m,
            senderId,
            messageType: type,
            isOwn: currentUserId != null && senderId === Number(currentUserId),
            content: type === 1 || type === 2 ? toAbsolute(m.content) : m.content,
          };
        });

        setMessages(normalized);
        setMsgPage(1);
        setMsgHasMore(hasMore);

        // join room + mark as read
        await joinConversation(activeConversationId);
        prevConversationIdRef.current = activeConversationId;

        // Call markAsRead to ensure server marks as read
        try {
          await markAsRead(activeConversationId);
          refreshUnseenCount(); // Update sidebar badge
        } catch (e) {
          console.error("markAsRead after join failed:", e);
        }

        // Reset unreadCount in state (ensure sync)
        setConversations((prev) =>
          (Array.isArray(prev) ? prev : []).map((c) =>
            c.id === activeConversationId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (err) {
        console.error("Switch conversation failed", err);
      }
    })();
  }, [activeConversationId, currentUserId, resetWorkSessionState]);

  // ===== fetch online users once hub ready (keep your logic) =====
  useEffect(() => {
    if (!hubReady || !isConnected()) return;

    const ids = (conversations || [])
      .map((c) => c.participantId)
      .filter(Boolean)
      .map(Number);

    const uniq = Array.from(new Set(ids));
    if (uniq.length) getOnlineUsers(uniq).catch(() => {});
  }, [hubReady, conversations]);
  useEffect(() => {
    workActionPopupRef.current = workActionPopup;
  }, [workActionPopup]);
  const activeConversation = conversations.find(
    (c) => (c.conversationId ?? c.id) === activeConversationId
  );

  // ===== work context from conversation =====
  const workContext = useMemo(() => {
    const orderId =
      activeConversation?.orderId ||
      activeConversation?.order?.orderId ||
      activeConversation?.order?.id ||
      activeConversation?.request?.orderId ||
      activeConversation?.request?.order?.id;

    // ưu tiên lấy trực tiếp
    let mentorId = null;
    let studentId = null;

    // 1) Nếu backend trả thẳng
    mentorId =
      activeConversation?.mentorId ||
      activeConversation?.mentor?.id ||
      null;

    studentId =
      activeConversation?.studentId ||
      activeConversation?.student?.id ||
      null;

    // 2) Fallback: suy ra từ messages
    if ((!mentorId || !studentId) && Array.isArray(messages) && currentUserId) {
      const otherMsg = messages.find(m => Number(m.senderId) !== Number(currentUserId));
      const otherUserId = otherMsg?.senderId;

      if (otherUserId) {
        // Giả định: currentUser là mentor nếu trong màn hình mentor, hoặc student nếu không
        // TẠM: gán currentUser là mentor
        mentorId = Number(currentUserId);
        studentId = Number(otherUserId);
      }
    }

    // fallback theo participantRole/participantId nếu thiếu
    const participantId =
      activeConversation?.participantId ||
      activeConversation?.participantUserId;

    const role = String(activeConversation?.participantRole || "").toLowerCase();

    if ((!mentorId || !studentId) && participantId && currentUserId) {
      if (role.includes("mentor")) {
        mentorId = Number(participantId);
        studentId = Number(currentUserId);
      } else if (role.includes("student")) {
        studentId = Number(participantId);
        mentorId = Number(currentUserId);
      }
    }

    return {
      orderId: orderId ? Number(orderId) : null,
      orderStatus: activeConversation?.orderStatus || null,
      mentorId,
      studentId,
      conversationId: activeConversationId ? Number(activeConversationId) : null,
    };
  }, [activeConversation, activeConversationId, currentUserId, messages]);


  // ===== reload active session when entering a conversation (important) =====
  useEffect(() => {
    if (!workContext?.orderId || !activeConversationId) {
      setWorkSession(null);
      return;
    }

    let isMounted = true;

    const loadActiveSession = async () => {
      try {
        // keep your endpoint assumption; adjust if backend differs
        const res = await axiosClient.get(
          `/api/order/${workContext.orderId}/sessions/summary`
        );

        const payload = res?.data?.data ?? res?.data;

        // Check order status from summary — hide button if order completed/cancelled
        const orderStatus = payload?.orderStatus;
        if (orderStatus && ["Completed", "Cancelled"].includes(orderStatus)) {
          // Update conversation's orderStatus so button hides
          setConversations(prev =>
            (Array.isArray(prev) ? prev : []).map(c =>
              (c.conversationId ?? c.id) === activeConversationId
                ? { ...c, orderStatus }
                : c
            )
          );
          if (isMounted) setWorkSession(null);
          return;
        }

        const active =
          payload?.activeSession || payload?.currentSession || payload?.session;

        if (!active || !isMounted) return;

        const status = String(active?.status || active?.state || "").toLowerCase();
        const normalizedStatus =
          status.includes("pause") || status.includes("paused")
            ? "paused"
            : status.includes("finish") || status.includes("end")
              ? null
              : "running";

        if (!normalizedStatus) {
          setWorkSession(null);
          return;
        }

        setWorkSession({
          status: normalizedStatus,
          sessionId: active?.sessionId || active?.id,
          orderId: workContext.orderId,
          startTime: active?.startTime,
          totalMinutes: active?.totalMinutes || active?.elapsedMinutes || 0,
        });
      } catch (err) {
        // ignore if endpoint not ready
        setWorkSession(null);
      }
    };

    loadActiveSession();

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, workContext?.orderId, setWorkSession]);

  // ===== Send text (keep your current behavior) =====
  const handleSendText = async (text) => {
    if (!activeConversationId) return;
    const t = (text ?? "").trim();
    if (!t) return;

    // Optimistic update for conversations list
    setConversations((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            lastMessage: t,
            lastMessageAt: new Date().toISOString(),
            lastMessageSenderName: "You"
          };
        }
        return c;
      });
    });

    await hubSendMessage({
      conversationId: activeConversationId,
      content: t,
      messageType: 0,
    });
  };
  const handleResumeWork = async () => {
    // tạm thời: chưa có backend resume
    toast.info("Resume not yet implemented. Backend API/Hub RequestResumeWork needed.");
  };


  // ===== Work handlers (invoke hub wrapper) =====
  // const handleStartWork = async () => {
  //   console.log("activeConversation =", activeConversation);
  //   console.log("workContext =", workContext);
  //   const { orderId, mentorId, studentId } = workContext;
  //   if (!orderId || !mentorId || !studentId) {
  //     toast.error("Thiếu thông tin để bắt đầu phiên làm việc.");
  //     return;
  //   }

  //   await requestStartWork(orderId, mentorId, studentId);
  // };
  const handleStartWork = async () => {
    try {

      await requestStartWork(
        Number(workContext.conversationId || activeConversationId),
        Number(workContext.orderId || 0),
        Number(workContext.mentorId || 0),
        Number(workContext.studentId || 0)
      );
    } catch (e) {
      console.error("RequestStartWork failed", e);
      toast.error("Start work failed (check server log)");
    }
  };

  const handlePauseWork = async () => {
    if (!workSession?.sessionId || !activeConversationId) return;
    await requestPauseWork(activeConversationId, workSession.sessionId);
  };

  const handleEndWork = async () => {
    if (!workSession?.sessionId || !activeConversationId) return;
    await requestEndWork(activeConversationId, workSession.sessionId);
  };

  const handleRequestCompleteOrder = async () => {
    if (!workContext?.orderId || !activeConversationId) return;
    if (completingOrder) return; // prevent double-click

    // If the other side already requested complete, auto-accept their request
    if (pendingCompleteRequest?.requestId) {
      setCompletingOrder(true);
      try {
        await respondWorkAction(pendingCompleteRequest.requestId, true);
        setPendingCompleteRequest(null);
        toast.dismiss("pending-complete");
        // OrderCompleted event will handle the rest (clear states, show success toast)
      } catch (e) {
        console.error("Auto-accept complete failed", e);
        toast.error("Failed to confirm completion");
        setCompletingOrder(false);
      }
      return;
    }

    setCompletingOrder(true);
    try {
      await requestCompleteOrder(activeConversationId, workContext.orderId);
      // Toast is handled by WorkActionSent listener — no duplicate here
    } catch (e) {
      console.error("RequestCompleteOrder failed", e);
      toast.error("Failed to send completion request");
      setCompletingOrder(false);
    }
  };



  return (
    <div className="h-[calc(100vh-64px)] w-full flex bg-neutral-50 dark:bg-neutral-950">
      {/* Modal confirm (for other user) */}
      <WorkActionConfirmModal
        isOpen={!!workActionPopup}
        actionType={workActionPopup?.actionType}
        onAccept={() => handleRespondWorkAction(true)}
        onReject={() => handleRespondWorkAction(false)}
      />

      {/* LEFT: conversations/groups list with tab switcher */}
      <div
        className={`w-full md:w-80 lg:w-[340px] border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0 ${activeConversationId || activeGroupId ? "hidden md:block" : "block"
          }`}
      >
        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "conversations"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "groups"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            Groups ({groups.length})
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "conversations" ? (
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
          />
        ) : (
          <GroupList
            groups={groups}
            activeGroupId={activeGroupId}
            activeGroup={activeGroup}
            onSelectGroup={handleSelectGroup}
            onRefreshGroups={handleRefreshGroups}
          />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${!(activeConversationId || activeGroupId) ? "hidden md:block" : "block"}`}>
        {/* Render GroupChatWindow or regular ChatWindow based on active tab */}
        {activeTab === "groups" && activeGroupId ? (
          <GroupChatWindow
            group={activeGroup}
            messages={groupMessages}
            onSend={handleSendGroupMessage}
            onSendImage={handleSendGroupImage}
            onBack={() => {
              setActiveGroupId(null);
              setActiveGroup(null);
            }}
            currentUserId={currentUserId}
            onLeaveGroup={handleLeaveGroup}
            onKickMember={handleKickMember}
            onLoadMore={handleLoadMoreGroupMessages}
            hasMore={groupHasMore}
            loadingMore={groupLoadingMore}
          />
        ) : (
          <div className="relative h-full">
            {workSession && (
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-[360px] max-w-[90%]
                         rounded-xl border border-neutral-200 dark:border-neutral-800
                         bg-white/95 dark:bg-neutral-900/95 shadow-md backdrop-blur px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {workSession.status === "running" && "Working"}
                      {workSession.status === "paused" && "Paused"}
                      {workSession.status === "pending" && "Waiting for confirmation..."}
                    </div>
                    <div className="text-lg font-mono text-neutral-900 dark:text-neutral-100">
                      {formatHMS(elapsedSeconds)}
                    </div>
                    {workSession.status === "pending" && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        ({workSession.pendingActionType === "pause" ? "Pause request" : "End request"})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!workSession && (
                      <button className="px-3 py-2 rounded-lg bg-neutral-900 text-white">
                        Start
                      </button>
                    )}

                    {workSession && (
                      <>
                        <button
                          className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800
                                   text-sm text-neutral-900 dark:text-neutral-100
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handlePauseWork}
                          disabled={workSession.status !== "running"}
                          title="Pause (requires partner approval)"
                        >
                          Pause
                        </button>

                        <button
                          className="px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleEndWork}
                          disabled={workSession.status === "pending"}
                          title="End (requires partner approval)"
                        >
                          End
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              onSend={handleSendText}
              onSendImage={handleSendImage}
              onBack={() => setActiveConversationId(null)}
              currentUserId={currentUserId}

              // pass handlers down in case you want a Start button in ChatWindow header/menu
              onStartWork={handleStartWork}
              onPauseWork={handlePauseWork}
              onEndWork={handleEndWork}
              onCompleteOrder={handleRequestCompleteOrder}
              completingOrder={completingOrder}
              pendingCompleteRequest={pendingCompleteRequest}
              workSession={workSession}
              workContext={workContext}
              onResumeWork={handleResumeWork}

              // Infinite scroll support
              onLoadMore={handleLoadMoreMessages}
              hasMore={msgHasMore}
              loadingMore={msgLoadingMore}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;

