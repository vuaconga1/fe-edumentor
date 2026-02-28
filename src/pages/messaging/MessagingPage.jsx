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

import {
  startChatHub,
  stopChatHub,
  joinConversation,
  leaveConversation,
  getOnlineUsers,
  on,
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
  const [currentUserName, setCurrentUserName] = useState(null);

  const [hubReady, setHubReady] = useState(false);

  // ===== Work session states =====
  // workSession: { status: "running"|"paused"|"pending", sessionId, orderId, startTime, totalMinutes, pendingActionType, pendingRequestId }
  const [workSession, setWorkSession] = useState(null);
  // workActionPopup: { requestId, actionType }  actionType: "start"|"pause"|"end"
  const [workActionPopup, setWorkActionPopup] = useState(null);
  // Pending complete request from the other side (non-blocking, no modal)
  const [pendingCompleteRequest, setPendingCompleteRequest] = useState(null);

  const activeConversationIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const prevConversationIdRef = useRef(null);
  const conversationsJoinedRef = useRef(false);
  const activeGroupIdRef = useRef(null);

  const hubStartedRef = useRef(false);

  // for reverting pinned when action rejected
  const pendingSnapshotRef = useRef(null);

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
        console.log('[MessagingPage] Conversations loaded from API:', res?.data?.data);
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
          
          console.log(`[MessagingPage] Conversation ${c.id} unreadCount from API:`, c.unreadCount);
          
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
        console.log('[MessagingPage] Groups loaded:', res?.data?.data);
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
    
    // ✅ Gọi markAsRead trên server để đánh dấu tin nhắn đã đọc
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
    
    // ✅ Gọi markGroupAsRead trên server để cập nhật LastReadAt
    try {
      markGroupAsRead(id);
      refreshUnseenCount(); // Update sidebar badge
    } catch (e) {
      console.error("markGroupAsRead failed:", e);
    }
    
    try {
      // Join SignalR group room for realtime messages
      await joinGroupRoom(id);
      console.log(`[MessagingPage] Joined group room ${id}`);
      
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
        
        // Log tổng số messages và số ảnh
        const imageCount = messages.filter(m => m.messageType === 2).length;
        console.log(`[DEBUG] Loaded ${messages.length} messages (${imageCount} images) for group ${id}`);
        
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

  const handleSendGroupImage = async (fileData) => {
    if (!activeGroupId || !fileData) return;
    
    // Extract file from object (GroupChatWindow sends {file, desc})
    const file = fileData.file || fileData;
    const desc = fileData.desc || null;
    
    // Validate file is a valid File/Blob object
    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error("Invalid file object:", fileData);
      toast.error("Invalid file");
      return;
    }

    const isImage = file.type?.startsWith("image/");
    const messageType = isImage ? 2 : 1; // 2 = Image, 1 = File
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempUrl = isImage ? URL.createObjectURL(file) : null;
    
    try {
      // Add temporary message immediately for instant feedback
      const tempMessage = {
        id: tempId,
        groupId: activeGroupId,
        senderId: currentUserId,
        senderName: currentUserName || "You",
        content: isImage ? tempUrl : file.name,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        messageType: messageType,
        createdAt: new Date().toISOString(),
        isTemp: true,
        isUploading: true
      };
      
      setGroupMessages((prev) => [...prev, tempMessage]);

      // Optimistic update for groups list
      const displayMessage = isImage ? "Image" : "File";
      setGroups((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((g) => {
          if (g.id === activeGroupId) {
            return {
              ...g,
              lastMessage: displayMessage,
              lastMessageAt: new Date().toISOString(),
              lastMessageSender: "You"
            };
          }
          return g;
        });
      });

      // Upload file
      const uploadResponse = isImage 
        ? await fileApi.uploadChatImage(file)
        : await fileApi.uploadChatFile(file);
      const data = uploadResponse?.data?.data;
      const fileUrl = data?.fileUrl || data?.url || (Array.isArray(data?.fileUrls) ? data.fileUrls[0] : null);
      
      if (!fileUrl) {
        console.error("Upload response:", uploadResponse);
        throw new Error("No file URL returned from upload");
      }

      // Update temp message with real URL
      setGroupMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempId ? { ...msg, content: toAbsolute(fileUrl), isTemp: false, isUploading: false } : msg
        )
      );

      // Send via SignalR
      await hubSendGroupMessage({
        groupId: activeGroupId,
        content: fileUrl,
        messageType: messageType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Send description if provided
      if (desc && desc.trim()) {
        await hubSendGroupMessage({
          groupId: activeGroupId,
          content: desc.trim(),
          messageType: 0 // Text
        });
      }
    } catch (error) {
      console.error("Send group file failed:", error);
      toast.error(isImage ? "Failed to send image" : "Failed to send file");
      
      // Remove temp message on error
      setGroupMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      // Clean up object URL
      if (tempUrl) {
        URL.revokeObjectURL(tempUrl);
      }
    }
  };

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // ===== Start hub only once + register listeners (messages + online + work events) =====
  useEffect(() => {
    if (!token) return;
    if (hubStartedRef.current) return;

    hubStartedRef.current = true;

    // Store cleanup functions (not called in StrictMode to preserve listeners)
    const cleanupFns = [];

    // Handle browser/tab close and navigation to set user offline
    const handlePageHide = () => {
      stopChatHub().catch(() => {});
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    (async () => {
      try {
        await startChatHub(BASE_URL, token);
        
        // ✅ Nếu effect đã bị cleanup (StrictMode), vẫn tiếp tục đăng ký listeners
        // vì hubStartedRef.current = true sẽ ngăn mount thứ hai chạy lại
        
        // Verify connection is actually ready before setting hubReady
        if (isConnected()) {
          setHubReady(true);
        } else {
          console.warn('ChatHub started but not yet connected');
          // Wait a bit and check again
          setTimeout(() => {
            if (isConnected()) {
              setHubReady(true);
            }
          }, 100);
        }

        // Track processed message IDs to prevent duplicates
        const processedMessageIds = new Set();

        // ===== ReceiveMessage (keep your mapping + avoid duplicates) =====
        cleanupFns.push(on("ReceiveMessage", (msg) => {
          const msgId = msg.id ?? msg.messageId;
          if (msgId && processedMessageIds.has(String(msgId))) {
            return;
          }
          if (msgId) {
            processedMessageIds.add(String(msgId));
          }
          
          const cid = Number(
            msg.conversationId ?? msg.conversationID ?? msg.conversation_id
          );
          if (!cid) return;

          const senderId = Number(
            msg.senderId ?? msg.senderID ?? msg.userId ?? msg.userID
          );
          const myId = Number(currentUserIdRef.current);
          
          // Parse messageType - C# enum: Text=0, File=1, Image=2
          const rawType = msg.messageType ?? msg.type;
          let type;
          if (typeof rawType === 'string') {
            if (rawType === 'Image') type = 2;
            else if (rawType === 'File') type = 1;
            else type = Number(rawType) || 0;
          } else {
            type = Number(rawType ?? 0);
          }

          const mapped = {
            ...msg,
            conversationId: cid,
            senderId,
            messageType: type,
            isOwn: myId && senderId === myId,
            content: type === 2 || type === 1 ? toAbsolute(msg.content) : msg.content,
          };

          // Format display message for preview - C# enum: Image=2, File=1
          let displayMessage = msg.content;
          if (type === 2) {
            displayMessage = "Image";
          } else if (type === 1) {
            displayMessage = "File";
          }

          // Tính toán bên ngoài setConversations (pure updater cho StrictMode)
          const isActive = cid === Number(activeConversationIdRef.current);
          const isMine = mapped.isOwn;

          // Update conversations list with latest message preview
          setConversations((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            
            // Tìm và cập nhật conversation
            const updatedList = list.map((c) => {
              if (c.id === cid) {
                // Nếu đang active -> reset count = 0
                // Nếu không active và không phải của mình -> tăng count
                let newUnreadCount;
                if (isActive) {
                  newUnreadCount = 0;
                } else if (!isMine) {
                  newUnreadCount = (c.unreadCount || 0) + 1;
                } else {
                  newUnreadCount = c.unreadCount || 0;
                }
                
                return {
                  ...c,
                  lastMessage: displayMessage,
                  lastMessageAt: msg.createdAt,
                  lastMessageSenderName: isMine ? "You" : msg.senderName || c.name,
                  unreadCount: newUnreadCount
                };
              }
              return c;
            });
            
            // Move conversation lên đầu danh sách (giống Zalo)
            const targetIndex = updatedList.findIndex(c => c.id === cid);
            if (targetIndex > 0) {
              const [target] = updatedList.splice(targetIndex, 1);
              updatedList.unshift(target);
            }
            
            return updatedList;
          });

          // only append to messages if current opened conversation
          if (cid !== Number(activeConversationIdRef.current)) {
            // Refresh sidebar badge when new message arrives for inactive conversation
            if (!mapped.isOwn) {
              refreshUnseenCount();
            }
            return;
          }

          setMessages((prev) => {
            const list = Array.isArray(prev) ? prev : [];

            const newId = msg.id ?? msg.messageId;

            // 1) nếu có id thật và đã tồn tại -> skip
            if (newId && list.some((m) => String(m.id ?? m.messageId) === String(newId))) {
              return list;
            }

            // 2) nếu là file/image -> replace temp tương ứng (tránh 2 tin)
            const type = Number(mapped.messageType ?? 0);
            const isFileOrImage = type === 1 || type === 2;

            if (isFileOrImage) {
              const idx = list.findIndex((m) => {
                const mid = String(m.id ?? "");
                if (!mid.startsWith("temp-")) return false;

                const sameConv = Number(m.conversationId) === Number(mapped.conversationId);
                const sameOwn = !!m.isOwn === !!mapped.isOwn;

                // so sánh URL/content sau normalize
                const sameContent = String(m.content ?? "") === String(mapped.content ?? "");

                // nếu có attachments/files thì so thêm
                const sameFiles =
                  JSON.stringify(m.files ?? m.attachments ?? []) ===
                  JSON.stringify(mapped.files ?? mapped.attachments ?? []);

                return sameConv && sameOwn && (sameContent || sameFiles);
              });

              if (idx >= 0) {
                const next = [...list];
                next[idx] = {
                  ...mapped,
                  // giữ isOwn theo local nếu server không set
                  isOwn: next[idx].isOwn ?? mapped.isOwn,
                };
                return next;
              }
            }

            // 3) default append
            return [...list, mapped];
          });

        }));

        // Track processed group message IDs
        const processedGroupMessageIds = new Set();

        // ===== ReceiveGroupMessage - realtime group messages =====
        cleanupFns.push(on("ReceiveGroupMessage", (msg) => {
          const msgId = msg.id ?? msg.Id;
          if (msgId && processedGroupMessageIds.has(String(msgId))) {
            return;
          }
          if (msgId) {
            processedGroupMessageIds.add(String(msgId));
          }
          
          const gid = Number(msg.groupId ?? msg.GroupId);
          if (!gid) return;

          const senderId = Number(msg.senderId ?? msg.SenderId ?? 0);
          const myId = Number(currentUserIdRef.current);
          const isMine = myId && senderId === myId;

          // Format lastMessage based on messageType
          // C# enum: Text=0, File=1, Image=2
          const rawType = msg.messageType;
          let messageType;
          if (typeof rawType === 'string') {
            if (rawType === 'Image') messageType = 2;
            else if (rawType === 'File') messageType = 1;
            else if (rawType === 'System') messageType = 3;
            else messageType = Number(rawType) || 0;
          } else {
            messageType = Number(rawType ?? 0);
          }

          let displayMessage = msg.content;
          if (messageType === 2) {
            displayMessage = "Image";
          } else if (messageType === 1) {
            displayMessage = "File";
          }
          
          // Tính toán bên ngoài setGroups (pure updater cho StrictMode)
          const isActiveGroup = gid === Number(activeGroupIdRef.current);
          
          // Update groups list with latest message preview
          setGroups((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            
            // Cập nhật group
            const updatedList = list.map((g) => {
              if (g.id === gid) {
                // Nếu đang active -> reset count = 0
                // Nếu không active và không phải của mình -> tăng count
                let newUnreadCount;
                if (isActiveGroup) {
                  newUnreadCount = 0;
                } else if (!isMine) {
                  newUnreadCount = (g.unreadCount || 0) + 1;
                } else {
                  newUnreadCount = g.unreadCount || 0;
                }
                  
                return {
                  ...g,
                  lastMessage: displayMessage,
                  lastMessageSender: isMine ? "You" : msg.senderName,
                  lastMessageAt: msg.createdAt,
                  unreadCount: newUnreadCount
                };
              }
              return g;
            });
            
            // Move group lên đầu danh sách (giống Zalo)
            const targetIndex = updatedList.findIndex(g => g.id === gid);
            if (targetIndex > 0) {
              const [target] = updatedList.splice(targetIndex, 1);
              updatedList.unshift(target);
            }
            
            return updatedList;
          });
          
          // Only append to messages if current opened group
          if (gid !== Number(activeGroupIdRef.current)) {
            // Refresh sidebar badge when new message arrives for inactive group
            if (!isMine) {
              refreshUnseenCount();
            }
            return;
          }

          // Convert relative URL to absolute for images/files
          const content = String(msg.content ?? "");
          const isUrl = /^\/uploads\//i.test(content) || /^https?:\/\//i.test(content);
          const hasImageExt = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(content);
          const isFileOrImage = messageType === 1 || messageType === 2 || (isUrl && hasImageExt);
          
          const mapped = {
            ...msg,
            groupId: gid,
            senderId,
            messageType,
            isOwn: myId && senderId === myId,
            content: isFileOrImage ? toAbsolute(content) : content,
          };
          
          setGroupMessages((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            
            // Check if message already exists (avoid duplicates)
            const newId = msg.id ?? msg.Id;
            if (newId && list.some((m) => String(m.id ?? m.Id) === String(newId))) {
              return list;
            }
            
            return [...list, mapped];
          });
        }));

        // ===== online presence listeners (keep yours) =====
        cleanupFns.push(on("OnlineUsers", (onlineIds) => {
          setConversations((prev) =>
            (Array.isArray(prev) ? prev : []).map((c) => ({
              ...c,
              isParticipantOnline: (onlineIds || []).includes(Number(c.participantId)),
            }))
          );
        }));

        cleanupFns.push(on("UserOnline", (userId) => {
          setConversations((prev) =>
            (Array.isArray(prev) ? prev : []).map((c) =>
              Number(c.participantId) === Number(userId)
                ? { ...c, isParticipantOnline: true }
                : c
            )
          );
        }));

        cleanupFns.push(on("UserOffline", (userId) => {
          setConversations((prev) =>
            (Array.isArray(prev) ? prev : []).map((c) =>
              Number(c.participantId) === Number(userId)
                ? { ...c, isParticipantOnline: false }
                : c
            )
          );
        }));

        // ===== WORK: popup to confirm (Start/Pause/End) =====
        cleanupFns.push(on("WorkActionPopup", (payload) => {
          console.log("WorkActionPopup payload:", payload);

          const conversationId = payload?.conversationId;
          if (conversationId && conversationId !== activeConversationIdRef.current) return;

          const rid = String(payload?.requestId ?? "").trim();
          const actionType = String(payload?.actionType || "").toLowerCase();

          if (!rid) {
            console.error("WorkActionPopup missing requestId!", payload);
            return;
          }

          if (!["start", "pause", "end", "complete"].includes(actionType)) return;

          // ✅ For "complete": don't show blocking modal, store separately
          if (actionType === "complete") {
            setPendingCompleteRequest({
              requestId: rid,
              actionType,
              raw: payload,
            });
            toast.info("The other side has requested to complete the order. Click 'Complete Order' to confirm.", { toastId: "pending-complete" });
            return;
          }

          // ✅ store full payload (not only requestId) — modal for start/pause/end only
          setWorkActionPopup({
            requestId: rid,
            actionType,
            raw: payload,
          });
        }));


        // ===== WORK: caller sent =====
        cleanupFns.push(on("WorkActionSent", (payload) => {
          if (!payload?.actionType) return;
          const actionLabel = {
            start: "start session",
            pause: "pause session",
            end: "end session",
            complete: "complete order",
          }[String(payload.actionType).toLowerCase()] || payload.actionType;
          toast.info(`Request to ${actionLabel} sent, waiting for confirmation...`, { toastId: `work-sent-${payload.actionType}` });
        }));

        // ===== WORK: group state pending (pause/end) =====
        cleanupFns.push(on("WorkActionState", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          const status = String(payload?.status || payload?.state || "").toLowerCase();
          const actionType = String(payload?.actionType || "").toLowerCase();

          if (
            (status.includes("pending") || status.includes("waiting")) &&
            (actionType === "pause" || actionType === "end")
          ) {
            setWorkSession((prev) => {
              if (!prev) return prev;

              // ❌ không set status="pending" nữa để timer không bị đứng
              return {
                ...prev,
                pendingActionType: actionType,
                pendingRequestId: payload?.requestId,
              };
            });
          }
        }));

        // ===== WORK: started -> show pinned running =====
        cleanupFns.push(on("WorkSessionStarted", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          setWorkSession({
            status: "running",
            sessionId: payload?.sessionId,
            orderId: payload?.orderId,
            startTime: payload?.startTime,
            totalMinutes: 0,
            pendingActionType: null,
            pendingRequestId: null,
          });
          pendingSnapshotRef.current = null;
        }));

        // ===== WORK: paused -> show pinned paused =====
        cleanupFns.push(on("WorkSessionPaused", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          setWorkSession((prev) => ({
            ...prev,
            status: "paused",
            totalMinutes: payload?.totalMinutes ?? prev?.totalMinutes ?? 0,
            pendingActionType: null,
            pendingRequestId: null,
          }));
          pendingSnapshotRef.current = null;
        }));

        // ===== WORK: ended -> hide pinned =====
        cleanupFns.push(on("WorkSessionEnded", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          setWorkSession(null);
          setWorkSession(null);
        }));

        // ===== WORK: rejected -> revert pinned snapshot =====
        cleanupFns.push(on("WorkActionRejected", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          const snapshot = pendingSnapshotRef.current;
          if (snapshot) setWorkSession({ ...snapshot });

          pendingSnapshotRef.current = null;
          setCompletingOrder(false);
          setPendingCompleteRequest(null);
          toast.error("The request has been rejected.", { toastId: "work-rejected" });
        }));

        // ===== WORK: Order Completed =====
        cleanupFns.push(on("OrderCompleted", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          setWorkSession(null); // Clear session if any
          // Update conversation's orderStatus so button hides immediately
          setConversations(prev =>
            (Array.isArray(prev) ? prev : []).map(c =>
              (c.conversationId ?? c.id) === Number(activeConversationIdRef.current)
                ? { ...c, orderStatus: "Completed" }
                : c
            )
          );
          setCompletingOrder(false);
          setPendingCompleteRequest(null);
          toast.dismiss("pending-complete"); // dismiss the pending toast if still visible
          toast.success("Order has been completed successfully!", { toastId: "order-completed" });
          // Potentially refresh conversation to show status update
        }));

        // ===== MessagesRead: khi đối phương (hoặc mình) đã đọc tin nhắn =====
        cleanupFns.push(on("MessagesRead", (payload) => {
          const cid = Number(payload?.conversationId ?? payload?.ConversationId);
          const readByUserId = Number(payload?.readByUserId ?? payload?.ReadByUserId ?? payload?.userId ?? payload?.UserId);
          const myId = Number(currentUserIdRef.current);

          // Nếu người đọc là mình → reset unreadCount cho conversation đó
          if (readByUserId === myId || !readByUserId) {
            setConversations((prev) =>
              (Array.isArray(prev) ? prev : []).map((c) =>
                c.id === cid ? { ...c, unreadCount: 0 } : c
              )
            );
          }
        }));

        // ===== GroupMessagesRead: khi server xác nhận đã đọc group messages =====
        cleanupFns.push(on("GroupMessagesRead", (payload) => {
          const gid = Number(payload?.groupId ?? payload?.GroupId);
          if (!gid) return;

          setGroups((prev) =>
            (Array.isArray(prev) ? prev : []).map((g) =>
              g.id === gid ? { ...g, unreadCount: 0 } : g
            )
          );
        }));

        // ===== NewMessageNotification: nhận thông báo tin nhắn mới cho conversation chưa join =====
        cleanupFns.push(on("NewMessageNotification", (payload) => {
          const cid = Number(payload?.conversationId ?? payload?.ConversationId);
          if (!cid) return;

          const msg = payload?.message ?? payload?.Message ?? payload;
          const msgId = msg?.id ?? msg?.messageId;
          const senderId = Number(msg?.senderId ?? msg?.SenderId ?? 0);
          const myId = Number(currentUserIdRef.current);
          const isMine = myId && senderId === myId;

          // Nếu tin nhắn đã được xử lý bởi ReceiveMessage (vì đã join room) thì bỏ qua
          if (msgId && processedMessageIds.has(String(msgId))) return;
          if (msgId) processedMessageIds.add(String(msgId));

          // Không tăng count cho tin nhắn của mình
          if (isMine) return;

          const isActive = cid === Number(activeConversationIdRef.current);
          if (isActive) return; // Đang xem conversation này rồi

          // Format display message
          const rawType = msg?.messageType ?? msg?.type;
          let type = typeof rawType === 'string' 
            ? (rawType === 'Image' ? 2 : rawType === 'File' ? 1 : Number(rawType) || 0)
            : Number(rawType ?? 0);
          let displayMessage = msg?.content;
          if (type === 2) displayMessage = "📷 Image";
          else if (type === 1) displayMessage = "📄 File";

          setConversations((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const updatedList = list.map((c) => {
              if (c.id === cid) {
                return {
                  ...c,
                  lastMessage: displayMessage || c.lastMessage,
                  lastMessageAt: msg?.createdAt || c.lastMessageAt,
                  lastMessageSenderName: payload?.senderName ?? payload?.SenderName ?? msg?.senderName ?? c.name,
                  unreadCount: (c.unreadCount || 0) + 1
                };
              }
              return c;
            });
            
            // Move lên đầu
            const targetIndex = updatedList.findIndex(c => c.id === cid);
            if (targetIndex > 0) {
              const [target] = updatedList.splice(targetIndex, 1);
              updatedList.unshift(target);
            }
            return updatedList;
          });
        }));
      } catch (e) {
        console.error("startChatHub failed", e);
        hubStartedRef.current = false;
        setHubReady(false);
      }
    })();

    return () => {
      // Don't cleanup listeners - they need to persist for the hub to work
      // Only remove window event listeners to prevent memory leaks
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      // Don't stop hub in React cleanup - only stop via pagehide event
      // This prevents StrictMode from disconnecting the hub
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ===== switch conversation: leave old -> load history -> join room (keep your logic) =====
  useEffect(() => {
    if (!activeConversationId) {
      const prev = prevConversationIdRef.current;
      if (prev) {
        leaveConversation(prev).catch(() => { });
        prevConversationIdRef.current = null;
      }
      setMessages([]);
      setWorkSession(null); // ✅ reset pinned when exit conversation (will reload when enter)
      setWorkActionPopup(null);
      setPendingCompleteRequest(null);
      setCompletingOrder(false);
      pendingSnapshotRef.current = null;
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

        // ✅ Gọi markAsRead để đảm bảo server đánh dấu đã đọc
        try {
          await markAsRead(activeConversationId);
          refreshUnseenCount(); // Update sidebar badge
        } catch (e) {
          console.error("markAsRead after join failed:", e);
        }

        // ✅ Reset unreadCount trong state (đảm bảo sync)
        setConversations((prev) =>
          (Array.isArray(prev) ? prev : []).map((c) =>
            c.id === activeConversationId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (err) {
        console.log("Switch conversation failed", err);
      }
    })();
  }, [activeConversationId, currentUserId]);

  // ===== fetch online users once hub ready (keep your logic) =====
  useEffect(() => {
    if (!hubReady) return;

    const ids = (conversations || [])
      .map((c) => c.participantId)
      .filter(Boolean)
      .map(Number);

    const uniq = Array.from(new Set(ids));
    if (uniq.length) getOnlineUsers(uniq);
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
  }, [activeConversation, activeConversationId, currentUserId]);


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

        // ✅ Check order status from summary — hide button if order completed/cancelled
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
  }, [activeConversationId, workContext?.orderId]);

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
  // ===== Send image/file (keep your current behavior) =====
  const handleSendImage = async ({ file, desc }) => {
    if (!activeConversationId || !file) return;

    const caption = (desc ?? "").trim();
    const isImage = file.type?.startsWith("image/");
    const tempId = `temp-att-${Date.now()}`;
    const localPreview = isImage ? URL.createObjectURL(file) : null;

    // optimistic
    setMessages((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        id: tempId,
        conversationId: activeConversationId,
        messageType: isImage ? 1 : 2,
        content: isImage ? localPreview : file.name,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isOwn: true,
        senderName: "You",
        createdAt: new Date().toISOString(),
        isUploading: true,
      },
    ]);

    try {
      const res = isImage
        ? await fileApi.uploadChatImage(file)
        : await fileApi.uploadChatFile(file);

      const data = res?.data?.data;

      const fileUrl =
        data?.fileUrl ||
        data?.url ||
        (Array.isArray(data?.fileUrls) ? data.fileUrls[0] : null);

      if (!fileUrl) throw new Error("Upload OK but missing fileUrl");

      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((m) =>
          m.id === tempId ? { ...m, isUploading: false, content: toAbsolute(fileUrl) } : m
        )
      );

      await hubSendMessage({
        conversationId: activeConversationId,
        messageType: isImage ? 1 : 2,
        content: fileUrl, // relative
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      if (caption) {
        await hubSendMessage({
          conversationId: activeConversationId,
          messageType: 0,
          content: caption,
        });
      }
    } catch (e) {
      console.error("Send attachment failed", e);
      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((m) =>
          m.id === tempId ? { ...m, isUploading: false, isError: true } : m
        )
      );
    } finally {
      if (localPreview) URL.revokeObjectURL(localPreview);
    }
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
      console.log("FORCE start work", workContext);

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

  const [completingOrder, setCompletingOrder] = useState(false);

  const handleRequestCompleteOrder = async () => {
    if (!workContext?.orderId || !activeConversationId) return;
    if (completingOrder) return; // prevent double-click

    // ✅ If the other side already requested complete, auto-accept their request
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
  const handleRespondWorkAction = async (accept) => {
    const rid = String(workActionPopup?.requestId ?? "").trim();
    console.log("[ui] RespondWorkAction click:", { rid, accept, workActionPopup });

    if (!rid) {
      toast.error("Missing requestId (popup not ready).");
      return;
    }

    try {
      await respondWorkAction(rid, !!accept);
    } catch (e) {
      console.error("RespondWorkAction failed", e);
      toast.error(e?.message || "RespondWorkAction failed");
    } finally {
      setWorkActionPopup(null);
    }
  };


  // ===== Timer for pinned bar =====
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!workSession || workSession.status !== "running") return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [workSession?.status]);

  const elapsedSeconds = useMemo(() => {
    if (!workSession) return 0;

    // paused/pending: show totalMinutes (from server) as fixed counter
    if (workSession.status === "paused" || workSession.status === "pending") {
      return Number(workSession.totalMinutes || 0) * 60;
    }

    // running: (now - startTime) + already accumulated minutes (if any)
    const start = workSession.startTime ? new Date(workSession.startTime.endsWith?.('Z') ? workSession.startTime : workSession.startTime + 'Z').getTime() : null;
    if (!start) return Number(workSession.totalMinutes || 0) * 60;

    const base = Number(workSession.totalMinutes || 0) * 60;
    const diff = Math.floor((Date.now() - start) / 1000);
    return base + Math.max(0, diff);
  }, [workSession?.status, workSession?.startTime, workSession?.totalMinutes, tick]);

  // ===== Handle Work Action Confirm =====
  const handleAcceptAction = async () => {
    if (!workActionPopup) return;
    try {
      await respondWorkAction(workActionPopup.requestId, true);
      setWorkActionPopup(null);
    } catch (e) {
      toast.error("Failed to accept");
    }
  };

  const handleRejectAction = async () => {
    if (!workActionPopup) return;
    try {
      await respondWorkAction(workActionPopup.requestId, false);
      setWorkActionPopup(null);
    } catch (e) {
      toast.error("Failed to reject");
    }
  };

  // ===== Handle Trigger Actions (from UI) =====
  const handleTriggerStart = async () => {
    if (!workContext) return;
    try {
      await requestStartWork(workContext.conversationId, workContext.orderId, workContext.mentorId, workContext.studentId);
      toast.info("Request sent to partner...");
    } catch (e) {
      toast.error("Failed to send request");
    }
  };

  const handleTriggerPause = async () => {
    if (!workSession?.sessionId) return;
    try {
      await requestPauseWork(workContext.conversationId, workSession.sessionId);
      toast.info("Request sent...");
    } catch (e) { toast.error("Failed"); }
  };

  const handleTriggerEnd = async () => {
    if (!workSession?.sessionId) return;
    try {
      await requestEndWork(workContext.conversationId, workSession.sessionId);
      toast.info("Request sent...");
    } catch (e) { toast.error("Failed"); }
  };


  return (
    <div className="h-[calc(100vh-64px)] w-full flex bg-neutral-50 dark:bg-neutral-950">
      {/* ✅ Modal confirm (for other user) */}
      <WorkActionConfirmModal
        isOpen={!!workActionPopup}
        actionType={workActionPopup?.actionType}
        onAccept={() => handleRespondWorkAction(true)}
        onReject={() => handleRespondWorkAction(false)}
      />

      {/* LEFT: conversations/groups list with tab switcher */}
      <div
        className={`w-full md:w-80 lg:w-[340px] border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0 ${
          activeConversationId || activeGroupId ? "hidden md:block" : "block"
        }`}
      >
        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "conversations"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "groups"
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
            onSend={handleSendText}       // ✅ text
            onSendImage={handleSendImage} // ✅ image/file
            onBack={() => setActiveConversationId(null)}
            currentUserId={currentUserId}

            // ✅ pass handlers down in case you want a Start button in ChatWindow header/menu
            onStartWork={handleStartWork}
            onPauseWork={handlePauseWork} // ✅ Added
            onEndWork={handleEndWork} // ✅ Added
            onCompleteOrder={handleRequestCompleteOrder} // ✅ New handler
            completingOrder={completingOrder} // ✅ Disable button while pending
            pendingCompleteRequest={pendingCompleteRequest} // ✅ Show indicator when other side requested
            workSession={workSession}
            workContext={workContext} // ✅ Pass workContext to check orderId
            onResumeWork={handleResumeWork}
            
            // ✅ Infinite scroll support
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
