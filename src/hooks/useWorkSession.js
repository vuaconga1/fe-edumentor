import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
    on,
    requestStartWork,
    requestPauseWork,
    requestEndWork,
    respondWorkAction,
} from "../signalr/chatHub";

export function useWorkSession(activeConversationIdRef, onOrderCompleted) {
    const [workSession, setWorkSession] = useState(null);
    const [workActionPopup, setWorkActionPopup] = useState(null);
    const [pendingCompleteRequest, setPendingCompleteRequest] = useState(null);
    const [completingOrder, setCompletingOrder] = useState(false);
    const pendingSnapshotRef = useRef(null);

    // ===== Timer for pinned bar =====
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!workSession || workSession.status !== "running") return;
        const t = setInterval(() => setTick((x) => x + 1), 1000);
        return () => clearInterval(t);
    }, [workSession?.status]);

    const elapsedSeconds = useMemo(() => {
        if (!workSession) return 0;
        if (workSession.status === "paused" || workSession.status === "pending") {
            return Number(workSession.totalMinutes || 0) * 60;
        }
        const start = workSession.startTime
            ? new Date(workSession.startTime.endsWith?.("Z") ? workSession.startTime : workSession.startTime + "Z").getTime()
            : null;
        if (!start) return Number(workSession.totalMinutes || 0) * 60;

        const base = Number(workSession.totalMinutes || 0) * 60;
        const diff = Math.floor((Date.now() - start) / 1000);
        return base + Math.max(0, diff);
    }, [workSession?.status, workSession?.startTime, workSession?.totalMinutes, tick]);

    // ===== SignalR Listeners for Work Session =====
    useEffect(() => {
        const cleanups = [];

        cleanups.push(on("WorkActionPopup", (payload) => {
            const conversationId = payload?.conversationId;
            if (conversationId && activeConversationIdRef.current && conversationId !== activeConversationIdRef.current) return;

            const rid = String(payload?.requestId ?? "").trim();
            const actionType = String(payload?.actionType || "").toLowerCase();

            if (!rid) {
                console.error("WorkActionPopup missing requestId!", payload);
                return;
            }

            if (!["start", "pause", "end", "complete"].includes(actionType)) return;

            if (actionType === "complete") {
                setPendingCompleteRequest({ requestId: rid, actionType, raw: payload });
                toast.info("The other side has requested to complete the order. Click 'Complete Order' to confirm.", { toastId: "pending-complete" });
                return;
            }

            setWorkActionPopup({ requestId: rid, actionType, raw: payload });
        }));

        cleanups.push(on("WorkActionSent", (payload) => {
            if (!payload?.actionType) return;
            const actionLabel = {
                start: "start session",
                pause: "pause session",
                end: "end session",
                complete: "complete order",
            }[String(payload.actionType).toLowerCase()] || payload.actionType;
            toast.info(`Request to ${actionLabel} sent, waiting for confirmation...`, { toastId: `work-sent-${payload.actionType}` });
        }));

        cleanups.push(on("WorkActionState", (payload) => {
            const conversationId = Number(payload?.conversationId);
            if (conversationId && activeConversationIdRef.current && conversationId !== Number(activeConversationIdRef.current)) return;

            const status = String(payload?.status || payload?.state || "").toLowerCase();
            const actionType = String(payload?.actionType || "").toLowerCase();

            if ((status.includes("pending") || status.includes("waiting")) && (actionType === "pause" || actionType === "end")) {
                setWorkSession((prev) => {
                    if (!prev) return prev;
                    return { ...prev, pendingActionType: actionType, pendingRequestId: payload?.requestId };
                });
            }
        }));

        cleanups.push(on("WorkSessionStarted", (payload) => {
            const conversationId = Number(payload?.conversationId);
            if (conversationId && activeConversationIdRef.current && conversationId !== Number(activeConversationIdRef.current)) return;

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

        cleanups.push(on("WorkSessionPaused", (payload) => {
            const conversationId = Number(payload?.conversationId);
            if (conversationId && activeConversationIdRef.current && conversationId !== Number(activeConversationIdRef.current)) return;

            setWorkSession((prev) => ({
                ...prev,
                status: "paused",
                totalMinutes: payload?.totalMinutes ?? prev?.totalMinutes ?? 0,
                pendingActionType: null,
                pendingRequestId: null,
            }));
            pendingSnapshotRef.current = null;
        }));

        cleanups.push(on("WorkSessionEnded", (payload) => {
            const conversationId = Number(payload?.conversationId);
            if (conversationId && activeConversationIdRef.current && conversationId !== Number(activeConversationIdRef.current)) return;

            setWorkSession(null);
        }));

        cleanups.push(on("WorkActionRejected", (payload) => {
            const conversationId = Number(payload?.conversationId);
            if (conversationId && activeConversationIdRef.current && conversationId !== Number(activeConversationIdRef.current)) return;

            const snapshot = pendingSnapshotRef.current;
            if (snapshot) setWorkSession({ ...snapshot });

            pendingSnapshotRef.current = null;
            setCompletingOrder(false);
            setPendingCompleteRequest(null);
            toast.error("The request has been rejected.", { toastId: "work-rejected" });
        }));

        cleanups.push(on("OrderCompleted", (payload) => {
            const conversationId = Number(payload?.conversationId) || Number(activeConversationIdRef.current);
            if (conversationId && activeConversationIdRef.current && conversationId !== Number(activeConversationIdRef.current)) return;

            setWorkSession(null);
            setCompletingOrder(false);
            setPendingCompleteRequest(null);
            toast.dismiss("pending-complete");
            toast.success("Order has been completed successfully!", { toastId: "order-completed" });

            if (onOrderCompleted) {
                onOrderCompleted(conversationId || activeConversationIdRef.current);
            }
        }));

        return () => {
            cleanups.forEach((fn) => fn());
        };
    }, [activeConversationIdRef, onOrderCompleted]);

    // ===== Action Handlers =====
    const handleRespondWorkAction = async (accept) => {
        const rid = String(workActionPopup?.requestId ?? "").trim();
        if (!rid) {
            toast.error("Missing requestId (popup not ready).");
            return;
        }
        try {
            await respondWorkAction(rid, !!accept);
        } catch (e) {
            toast.error(e?.message || "RespondWorkAction failed");
        } finally {
            setWorkActionPopup(null);
        }
    };

    const handleTriggerStart = async (workContext) => {
        if (!workContext) return;
        try {
            await requestStartWork(workContext.conversationId, workContext.orderId, workContext.mentorId, workContext.studentId);
            toast.info("Request sent to partner...");
        } catch (e) {
            toast.error("Failed to send request");
        }
    };

    const handleTriggerPause = async (workContext) => {
        if (!workSession?.sessionId) return;
        try {
            await requestPauseWork(workContext.conversationId, workSession.sessionId);
            toast.info("Request sent...");
        } catch (e) { toast.error("Failed"); }
    };

    const handleTriggerEnd = async (workContext) => {
        if (!workSession?.sessionId) return;
        try {
            await requestEndWork(workContext.conversationId, workSession.sessionId);
            toast.info("Request sent...");
        } catch (e) { toast.error("Failed"); }
    };

    const resetWorkSessionState = useCallback(() => {
        setWorkSession(null);
        setWorkActionPopup(null);
        setPendingCompleteRequest(null);
        setCompletingOrder(false);
        pendingSnapshotRef.current = null;
    }, []);

    return {
        workSession,
        setWorkSession,
        workActionPopup,
        pendingCompleteRequest,
        completingOrder,
        elapsedSeconds,
        setCompletingOrder,
        setPendingCompleteRequest,
        handleRespondWorkAction,
        handleTriggerStart,
        handleTriggerPause,
        handleTriggerEnd,
        resetWorkSessionState
    };
}
