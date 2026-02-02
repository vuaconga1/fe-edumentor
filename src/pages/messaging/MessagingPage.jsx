import React, { useEffect, useMemo, useRef, useState } from "react";
import ConversationList from "../../components/messaging/ConversationList";
import ChatWindow from "../../components/messaging/ChatWindow";
import chatApi from "../../api/chatApi";
import fileApi from "../../api/fileApi";
import axiosClient from "../../api/axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import WorkActionConfirmModal from "../../components/messaging/WorkActionConfirmModal";
import { Play, Pause, Square, Clock } from "lucide-react";

import {
  startChatHub,
  joinConversation,
  leaveConversation,
  getOnlineUsers,
  on,
  sendMessage as hubSendMessage,
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
  const hubStartedRef = useRef(false);

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

  // ===== Start hub only once + register listeners (messages + online + work events) =====
  useEffect(() => {
    if (!token) return;
    if (hubStartedRef.current) return;

    let offReceive;
    let offWorkPopup;
    let offWorkState;
    let offSessionStarted;
    let offSessionPaused;
    let offSessionEnded;

    (async () => {
      await startChatHub(BASE_URL, token);
      hubStartedRef.current = true;
      setHubReady(true);

      offReceive = on("ReceiveMessage", (msg) => {
        // Only add if specific room is open
        if ((msg.conversationId ?? msg.conversationID) !== activeConversationIdRef.current) return;
        setMessages(prev => Array.isArray(prev) ? [...prev, msg] : [msg]);
      });

      // Work Action Request Popup (when partner requests something)
      offWorkPopup = on("WorkActionPopup", (data) => {
        setWorkActionPopup(data);
      });

      // Work Action State Change (Waiting, Rejected etc.)
      offWorkState = on("WorkActionState", (data) => {
        // Update local state if needed OR just toast
        if (data.status === "Rejected") {
          toast.info("Request was rejected by partner");
        }
      });

      // Session Started
      offSessionStarted = on("WorkSessionStarted", (data) => {
        setWorkSession({
          status: "running",
          sessionId: data.sessionId,
          orderId: data.orderId,
          startTime: data.startTime,
          totalMinutes: 0
        });
        toast.success("Work session started!");
      });

      // Session Paused
      offSessionPaused = on("WorkSessionPaused", (data) => {
        setWorkSession(prev => ({
          ...prev,
          status: "paused",
          totalMinutes: data.totalMinutes
        }));
        toast.info("Work session paused");
      });

      // Session Ended
      offSessionEnded = on("WorkSessionEnded", (data) => {
        setWorkSession(null);
        toast.success("Work session ended. Payment released.");
      });

    })();

    return () => {
      offReceive?.();
      offWorkPopup?.();
      offWorkState?.();
      offSessionStarted?.();
      offSessionPaused?.();
      offSessionEnded?.();
    };
  }, [token]);


  // ===== switch conversation: leave old -> load history -> join room =====
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
        
        // Sort chronological
        normalized.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(normalized);
        
        // Join signalR group
        if (hubStartedRef.current) {
          joinConversation(activeConversationId);
        }

      } catch (err) {
        console.log("Load messages failed", err);
      }
    };

    loadMessages();
    return () => {
       if (activeConversationId && hubStartedRef.current) {
         leaveConversation(activeConversationId);
       }
    };
  }, [activeConversationId, currentUserId]);


  const activeConversation = conversations.find(
    (c) => (c.conversationId ?? c.id) === activeConversationId
  );

  // ===== work context from conversation =====
  const workContext = useMemo(() => {
    if (!activeConversation) return null;

    const orderId =
      activeConversation?.orderId ||
      activeConversation?.order?.orderId ||
      activeConversation?.order?.id ||
      activeConversation?.request?.orderId ||
      activeConversation?.request?.order?.id;

    // Direct assignment if available, else derive (simplified for now)
    const mentorId = activeConversation?.mentorId || activeConversation?.mentor?.id;
    const studentId = activeConversation?.studentId || activeConversation?.student?.id;

    return {
      orderId: orderId ? Number(orderId) : null,
      mentorId,
      studentId,
      conversationId: activeConversationId ? Number(activeConversationId) : null,
    };
  }, [activeConversation, activeConversationId]);


  // ===== reload active session when entering a conversation =====
  useEffect(() => {
    if (!workContext?.orderId || !activeConversationId) {
      setWorkSession(null);
      return;
    }

    let isMounted = true;

    const loadActiveSession = async () => {
      try {
        const res = await axiosClient.get(
          `/api/order/${workContext.orderId}/sessions/summary`
        );

        const payload = res?.data?.data ?? res?.data;
        const active = payload?.activeSession || payload?.currentSession || payload?.session;

        if (!isMounted) return;

        if (!active) {
            setWorkSession(null);
            return;
        }

        const status = String(active?.status || active?.state || "").toLowerCase();
        const normalizedStatus =
          status.includes("pause") || status.includes("paused")
            ? "paused"
            : status.includes("finish") || status.includes("end")
              ? "ended"
              : "running";
        
        if (normalizedStatus === "ended") {
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
        setWorkSession(null);
      }
    };

    loadActiveSession();

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, workContext?.orderId]);

  // ===== Send text =====
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

  // ===== Send image/file =====
  const handleSendImage = async ({ file, desc }) => {
    if (!activeConversationId || !file) return;

    // TODO: Implement file upload API -> get URL -> send message with type 1/2
    // For now mocking or basic implementation
    try {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fileApi.uploadFile(formData); // Assuming fileApi exists
        const fileUrl = uploadRes.data.url; 

        // Send message via Hub? Or API?
        // If Hub supports SendMessageWithFiles, use that. 
        // For simplicity reusing text message flow if only URL needed, OR specific flow
        // The chatHub.js has sendMessageWithFiles, let's assume valid usage:
        
        // This part needs real implementation matching backend. 
        // Since backend has SendMessageWithFiles, let's use it if available in client
        // Or send as text with special formatting/metadata if simple.
        
        toast.info("Sending file...");
        
        // Re-using text send for simplicity if file upload returns generic URL
        // In real app, call hubSendMessageWithFiles
        await hubSendMessage({
            conversationId: activeConversationId,
            content: fileUrl, // Just sending URL for now
            messageType: file.type.startsWith("image/") ? 1 : 2
        });

    } catch (e) {
        console.error("Upload failed", e);
        toast.error("Failed to upload file");
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

    // running: (now - startTime) + already accumulated minutes
    const start = workSession.startTime ? new Date(workSession.startTime).getTime() : null;
    if (!start) return Number(workSession.totalMinutes || 0) * 60;

    const base = Number(workSession.totalMinutes || 0) * 60;
    // Difference in seconds
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
    } catch(e) { toast.error("Failed"); }
  };

  const handleTriggerEnd = async () => {
    if (!workSession?.sessionId) return;
    try {
        await requestEndWork(workContext.conversationId, workSession.sessionId);
        toast.info("Request sent...");
    } catch(e) { toast.error("Failed"); }
  };


  return (
    <div className="h-[calc(100vh-64px)] w-full flex bg-neutral-50 dark:bg-neutral-950 relative">
      
      <WorkActionConfirmModal 
        isOpen={!!workActionPopup}
        actionType={workActionPopup?.actionType}
        onAccept={handleAcceptAction}
        onReject={handleRejectAction}
      />

      {/* LEFT: conversations */}
      <div className={`w-full md:w-80 lg:w-[340px] border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0 ${activeConversationId ? 'hidden md:block' : 'block'}`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />
      </div>

      {/* RIGHT: chat */}
      <div className={`flex-1 min-w-0 flex flex-col ${!activeConversationId ? 'hidden md:block' : 'block'}`}>
        
        {/* WORK SESSION TIMER BAR */}
        {activeConversationId && workContext?.orderId && (
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${workSession?.status === 'running' ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-neutral-100 text-neutral-500'}`}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="text-xl font-mono font-bold text-neutral-800 dark:text-neutral-200">
                            {formatHMS(elapsedSeconds)}
                        </div>
                        <div className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">
                            {workSession?.status || 'Ready'}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {!workSession && (
                        <button onClick={handleTriggerStart} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                            <Play size={16} fill="currentColor" /> Start
                        </button>
                    )}
                    {workSession?.status === 'running' && (
                        <button onClick={handleTriggerPause} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium transition-colors">
                            <Pause size={16} fill="currentColor" /> Pause
                        </button>
                    )}
                    {(workSession?.status === 'running' || workSession?.status === 'paused') && (
                        <button onClick={handleTriggerEnd} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">
                            <Square size={16} fill="currentColor" /> End
                        </button>
                    )}
                </div>
            </div>
        )}

        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          onSend={handleSendText} // ✅ Fixed: Passed handleSendText
          currentUserId={currentUserId}
          onBack={() => setActiveConversationId(null)}
        />
      </div>
    </div>
  );
};

export default MessagingPage;
