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

    hubStartedRef.current = true;

    let offReceive;
    let offOnlineUsers;
    let offUserOnline;
    let offUserOffline;

    let offActionPopup;
    let offActionSent;
    let offActionState;
    let offSessionStarted;
    let offSessionPaused;
    let offSessionEnded;
    let offActionRejected;

    (async () => {
      try {
        await startChatHub(BASE_URL, token);
        setHubReady(true);

        // ===== ReceiveMessage (keep your mapping + avoid duplicates) =====
        offReceive = on("ReceiveMessage", (msg) => {
          const cid = Number(
            msg.conversationId ?? msg.conversationID ?? msg.conversation_id
          );
          if (!cid) return;

          // only append if current opened conversation
          if (cid !== Number(activeConversationIdRef.current)) return;

          const senderId = Number(
            msg.senderId ?? msg.senderID ?? msg.userId ?? msg.userID
          );
          const myId = Number(currentUserIdRef.current);
          const type = Number(msg.messageType ?? msg.type ?? 0);

          const mapped = {
            ...msg,
            conversationId: cid,
            senderId,
            messageType: type,
            isOwn: myId && senderId === myId,
            content: type === 1 || type === 2 ? toAbsolute(msg.content) : msg.content,
          };

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

        });

        // ===== online presence listeners (keep yours) =====
        offOnlineUsers = on("OnlineUsers", (onlineIds) => {
          setConversations((prev) =>
            (Array.isArray(prev) ? prev : []).map((c) => ({
              ...c,
              isParticipantOnline: (onlineIds || []).includes(Number(c.participantId)),
            }))
          );
        });

        offUserOnline = on("UserOnline", (userId) => {
          setConversations((prev) =>
            (Array.isArray(prev) ? prev : []).map((c) =>
              Number(c.participantId) === Number(userId)
                ? { ...c, isParticipantOnline: true }
                : c
            )
          );
        });

        offUserOffline = on("UserOffline", (userId) => {
          setConversations((prev) =>
            (Array.isArray(prev) ? prev : []).map((c) =>
              Number(c.participantId) === Number(userId)
                ? { ...c, isParticipantOnline: false }
                : c
            )
          );
        });

        // ===== WORK: popup to confirm (Start/Pause/End) =====
        offActionPopup = on("WorkActionPopup", (payload) => {
          console.log("WorkActionPopup payload:", payload);

          const conversationId = payload?.conversationId;
          if (conversationId && conversationId !== activeConversationIdRef.current) return;

          const rid = String(payload?.requestId ?? "").trim();
          const actionType = String(payload?.actionType || "").toLowerCase();

          if (!rid) {
            console.error("WorkActionPopup missing requestId!", payload);
            return;
          }
          if (!["start", "pause", "end"].includes(actionType)) return;

          // ✅ store full payload (not only requestId)
          setWorkActionPopup({
            requestId: rid,
            actionType,
            raw: payload,
          });
        });


        // ===== WORK: caller sent =====
        offActionSent = on("WorkActionSent", (payload) => {
          if (!payload?.actionType) return;
          toast.info("Đã gửi yêu cầu, chờ xác nhận...");
        });

        // ===== WORK: group state pending (pause/end) =====
        offActionState = on("WorkActionState", (payload) => {
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
              pendingSnapshotRef.current = prev;
              return {
                ...prev,
                status: "pending",
                pendingActionType: actionType,
                pendingRequestId: payload?.requestId,
              };
            });
          }
        });

        // ===== WORK: started -> show pinned running =====
        offSessionStarted = on("WorkSessionStarted", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          setWorkSession({
            status: "running",
            sessionId: payload?.sessionId ?? payload?.id,
            orderId: payload?.orderId,
            startTime: payload?.startTime,
            totalMinutes: 0,
          });
          pendingSnapshotRef.current = null;
        });

        // ===== WORK: paused -> show pinned paused =====
        offSessionPaused = on("WorkSessionPaused", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          setWorkSession((prev) => ({
            status: "paused",
            sessionId: payload?.sessionId ?? payload?.id ?? prev?.sessionId,
            orderId: payload?.orderId ?? prev?.orderId,
            startTime: prev?.startTime,
            totalMinutes: payload?.totalMinutes ?? prev?.totalMinutes ?? 0,
          }));
          pendingSnapshotRef.current = null;
        });

        // ===== WORK: ended -> hide pinned =====
        offSessionEnded = on("WorkSessionEnded", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          setWorkSession(null);
          pendingSnapshotRef.current = null;
        });

        // ===== WORK: rejected -> revert pinned snapshot =====
        offActionRejected = on("WorkActionRejected", (payload) => {
          const conversationId = Number(payload?.conversationId);
          if (conversationId && conversationId !== Number(activeConversationIdRef.current)) return;

          const snapshot = pendingSnapshotRef.current;
          if (snapshot) setWorkSession({ ...snapshot });

          pendingSnapshotRef.current = null;
          toast.error("Yêu cầu đã bị từ chối.");
        });
      } catch (e) {
        console.error("startChatHub failed", e);
        hubStartedRef.current = false;
        setHubReady(false);
      }
    })();

    return () => {
      offReceive?.();
      offOnlineUsers?.();
      offUserOnline?.();
      offUserOffline?.();

      offActionPopup?.();
      offActionSent?.();
      offActionState?.();
      offSessionStarted?.();
      offSessionPaused?.();
      offSessionEnded?.();
      offActionRejected?.();

      hubStartedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ===== switch conversation: leave old -> load history -> join room =====
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
      pendingSnapshotRef.current = null;
      return;
    }

    (async () => {
      try {
        const prev = prevConversationIdRef.current;
        if (prev && prev !== activeConversationId) {
          await leaveConversation(prev);
        }

        // load history
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

        setMessages(normalized);

        // join room
        await joinConversation(activeConversationId);
        prevConversationIdRef.current = activeConversationId;
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
    <div className="h-[calc(100vh-64px)] w-full flex bg-neutral-50 dark:bg-neutral-950">
      {/* ✅ Modal confirm (for other user) */}
      <WorkActionConfirmModal
        isOpen={!!workActionPopup}
        actionType={workActionPopup?.actionType}
        onAccept={() => handleRespondWorkAction(true)}
        onReject={() => handleRespondWorkAction(false)}
      />

      {/* LEFT: conversations */}
      <div
        className={`w-full md:w-80 lg:w-[340px] border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0 ${activeConversationId ? "hidden md:block" : "block"
          }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />
      </div>

      RIGHT: chat
      <div className={`flex-1 min-w-0 ${!activeConversationId ? "hidden md:block" : "block"}`}>
        {/* ✅ pinned top-middle (overlay). Only shows when session exists */}
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
                    {workSession.status === "running" && "Đang làm việc"}
                    {workSession.status === "paused" && "Đang tạm dừng"}
                    {workSession.status === "pending" && "Chờ đối phương xác nhận..."}
                  </div>
                  <div className="text-lg font-mono text-neutral-900 dark:text-neutral-100">
                    {formatHMS(elapsedSeconds)}
                  </div>
                  {workSession.status === "pending" && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      ({workSession.pendingActionType === "pause" ? "Yêu cầu tạm dừng" : "Yêu cầu kết thúc"})
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
                        title="Pause (cần đối phương đồng ý)"
                      >
                        Pause
                      </button>

                      <button
                        className="px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleEndWork}
                        disabled={workSession.status === "pending"}
                        title="End (cần đối phương đồng ý)"
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
            workSession={workSession}
          />
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
