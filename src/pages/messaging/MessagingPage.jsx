import React, { useEffect, useMemo, useRef, useState } from "react";
import ConversationList from "../../components/messaging/ConversationList";
import ChatWindow from "../../components/messaging/ChatWindow";
import chatApi from "../../api/chatApi";
import fileApi from "../../api/fileApi";
import axiosClient from "../../api/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import WorkActionConfirmModal from "../../components/messaging/WorkActionConfirmModal";

import {
  startChatHub,
  joinConversation,
  leaveConversation,
  getOnlineUsers, // ✅ existing
  on,
  sendMessage as hubSendMessage,

  // ✅ start work features
  requestStartWork,
  requestPauseWork,
  requestEndWork,
  respondWorkAction,
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
  const workActionPopupRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [hubReady, setHubReady] = useState(false);

  // ===== Work session states =====
  // workSession: { status: "running"|"paused"|"pending", sessionId, orderId, startTime, totalMinutes, pendingActionType, pendingRequestId }
  const [workSession, setWorkSession] = useState(null);
  // workActionPopup: { requestId, actionType }  actionType: "start"|"pause"|"end"
  const [workActionPopup, setWorkActionPopup] = useState(null);

  const activeConversationIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const prevConversationIdRef = useRef(null);

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

  // load conversations
  useEffect(() => {
    (async () => {
      try {
        const res = await chatApi.getConversations();
        setConversations(res?.data?.data ?? []);
      } catch (e) {
        console.error("Load conversations failed", e);
        setConversations([]);
      }
    })();
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // ===== Start hub only once + register listeners (messages + online + work events) =====
  useEffect(() => {
    if (!token) return;
    if (hubStartedRef.current) return;

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


  // ===== switch conversation: leave old -> load history -> join room (keep your logic) =====
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

      } catch (err) {
        console.log("Load messages failed", err);
      }
    };

    loadMessages();
  }, [activeConversationId]);


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

    await hubSendMessage({
      conversationId: activeConversationId,
      content: t,
      messageType: 0,
    });
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
    const start = workSession.startTime ? new Date(workSession.startTime).getTime() : null;
    if (!start) return Number(workSession.totalMinutes || 0) * 60;

    const base = Number(workSession.totalMinutes || 0) * 60;
    const diff = Math.floor((Date.now() - start) / 1000);
    return base + Math.max(0, diff);
  }, [workSession?.status, workSession?.startTime, workSession?.totalMinutes, tick]);

  return (
    <div className="h-[calc(100vh-64px)] w-full flex bg-neutral-50 dark:bg-neutral-950">
      {/* LEFT: conversations - Ẩn trên mobile khi đang chat */}
      <div className={`w-full md:w-80 lg:w-[340px] border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0 ${activeConversationId ? 'hidden md:block' : 'block'}`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />
      </div>

      {/* RIGHT: chat - Ẩn trên mobile khi chưa chọn conversation */}
      <div className={`flex-1 min-w-0 ${!activeConversationId ? 'hidden md:block' : 'block'}`}>
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          onSend={handleSend}
          currentUserId={currentUserId}
          onBack={() => setActiveConversationId(null)}
        />
      </div>
    </div>
  );
};

export default MessagingPage;
