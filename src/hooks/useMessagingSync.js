import { useEffect } from "react";
import { startChatHub, stopChatHub, on } from "../signalr/chatHub";
import { normalizeMessageType, getMessagePreview, isMediaFile, toAbsolute } from "../utils/messageUtils";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function useMessagingSync({
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
}) {
    useEffect(() => {
        if (!token) return;
        if (hubStartedRef.current) return;

        hubStartedRef.current = true;
        const cleanupFns = [];

        const handlePageHide = () => {
            stopChatHub().catch(() => { });
        };
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('beforeunload', handlePageHide);

        (async () => {
            try {
                await startChatHub(BASE_URL, token);
                setHubReady(true);

                const processedMessageIds = new Set();

                cleanupFns.push(on("ReceiveMessage", (msg) => {
                    const msgId = msg.id ?? msg.messageId;
                    if (msgId && processedMessageIds.has(String(msgId))) return;
                    if (msgId) processedMessageIds.add(String(msgId));

                    const cid = Number(msg.conversationId ?? msg.conversationID ?? msg.conversation_id);
                    if (!cid) return;

                    const senderId = Number(msg.senderId ?? msg.senderID ?? msg.userId ?? msg.userID);
                    const myId = Number(currentUserIdRef.current);
                    const type = normalizeMessageType(msg.messageType ?? msg.type);

                    const mapped = {
                        ...msg,
                        conversationId: cid,
                        senderId,
                        messageType: type,
                        isOwn: myId && senderId === myId,
                        content: type === 2 || type === 1 ? toAbsolute(msg.content) : msg.content,
                    };

                    let displayMessage = getMessagePreview(type, msg.content);
                    const isActive = cid === Number(activeConversationIdRef.current);
                    const isMine = mapped.isOwn;

                    setConversations((prev) => {
                        const list = Array.isArray(prev) ? prev : [];
                        const updatedList = list.map((c) => {
                            if (c.id === cid) {
                                let newUnreadCount;
                                if (isActive) newUnreadCount = 0;
                                else if (!isMine) newUnreadCount = (c.unreadCount || 0) + 1;
                                else newUnreadCount = c.unreadCount || 0;

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

                        const targetIndex = updatedList.findIndex(c => c.id === cid);
                        if (targetIndex > 0) {
                            const [target] = updatedList.splice(targetIndex, 1);
                            updatedList.unshift(target);
                        }
                        return updatedList;
                    });

                    if (cid !== Number(activeConversationIdRef.current)) {
                        if (!mapped.isOwn) refreshUnseenCount();
                        return;
                    }

                    setMessages((prev) => {
                        const list = Array.isArray(prev) ? prev : [];
                        const newId = msg.id ?? msg.messageId;

                        if (newId && list.some((m) => String(m.id ?? m.messageId) === String(newId))) {
                            return list;
                        }

                        const isFileOrImage = type === 1 || type === 2;
                        if (isFileOrImage) {
                            const idx = list.findIndex((m) => {
                                const mid = String(m.id ?? "");
                                if (!mid.startsWith("temp-")) return false;
                                const sameConv = Number(m.conversationId) === Number(mapped.conversationId);
                                const sameOwn = !!m.isOwn === !!mapped.isOwn;
                                const sameContent = String(m.content ?? "") === String(mapped.content ?? "");
                                const sameFiles = JSON.stringify(m.files ?? m.attachments ?? []) === JSON.stringify(mapped.files ?? mapped.attachments ?? []);
                                return sameConv && sameOwn && (sameContent || sameFiles);
                            });

                            if (idx >= 0) {
                                const next = [...list];
                                next[idx] = { ...mapped, isOwn: next[idx].isOwn ?? mapped.isOwn };
                                return next;
                            }
                        }

                        return [...list, mapped];
                    });
                }));

                const processedGroupMessageIds = new Set();

                cleanupFns.push(on("ReceiveGroupMessage", (msg) => {
                    const msgId = msg.id ?? msg.Id;
                    if (msgId && processedGroupMessageIds.has(String(msgId))) return;
                    if (msgId) processedGroupMessageIds.add(String(msgId));

                    const gid = Number(msg.groupId ?? msg.GroupId);
                    if (!gid) return;

                    const senderId = Number(msg.senderId ?? msg.SenderId ?? 0);
                    const myId = Number(currentUserIdRef.current);
                    const isMine = myId && senderId === myId;
                    const messageType = normalizeMessageType(msg.messageType);
                    let displayMessage = getMessagePreview(messageType, msg.content);
                    const isActiveGroup = gid === Number(activeGroupIdRef.current);

                    setGroups((prev) => {
                        const list = Array.isArray(prev) ? prev : [];
                        const updatedList = list.map((g) => {
                            if (g.id === gid) {
                                let newUnreadCount;
                                if (isActiveGroup) newUnreadCount = 0;
                                else if (!isMine) newUnreadCount = (g.unreadCount || 0) + 1;
                                else newUnreadCount = g.unreadCount || 0;

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

                        const targetIndex = updatedList.findIndex(g => g.id === gid);
                        if (targetIndex > 0) {
                            const [target] = updatedList.splice(targetIndex, 1);
                            updatedList.unshift(target);
                        }
                        return updatedList;
                    });

                    if (gid !== Number(activeGroupIdRef.current)) {
                        if (!isMine) refreshUnseenCount();
                        return;
                    }

                    const content = String(msg.content ?? "");
                    const isFileOrImage = isMediaFile(messageType, content);

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
                        const newId = msg.id ?? msg.Id;
                        if (newId && list.some((m) => String(m.id ?? m.Id) === String(newId))) return list;
                        return [...list, mapped];
                    });
                }));

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
                            Number(c.participantId) === Number(userId) ? { ...c, isParticipantOnline: true } : c
                        )
                    );
                }));

                cleanupFns.push(on("UserOffline", (userId) => {
                    setConversations((prev) =>
                        (Array.isArray(prev) ? prev : []).map((c) =>
                            Number(c.participantId) === Number(userId) ? { ...c, isParticipantOnline: false } : c
                        )
                    );
                }));

                cleanupFns.push(on("MessagesRead", (payload) => {
                    const cid = Number(payload?.conversationId ?? payload?.ConversationId);
                    const readByUserId = Number(payload?.readByUserId ?? payload?.ReadByUserId ?? payload?.userId ?? payload?.UserId);
                    const myId = Number(currentUserIdRef.current);

                    if (readByUserId === myId || !readByUserId) {
                        setConversations((prev) =>
                            (Array.isArray(prev) ? prev : []).map((c) =>
                                c.id === cid ? { ...c, unreadCount: 0 } : c
                            )
                        );
                    }
                }));

                cleanupFns.push(on("GroupMessagesRead", (payload) => {
                    const gid = Number(payload?.groupId ?? payload?.GroupId);
                    if (!gid) return;

                    setGroups((prev) =>
                        (Array.isArray(prev) ? prev : []).map((g) =>
                            g.id === gid ? { ...g, unreadCount: 0 } : g
                        )
                    );
                }));

                cleanupFns.push(on("NewMessageNotification", (payload) => {
                    const cid = Number(payload?.conversationId ?? payload?.ConversationId);
                    if (!cid) return;

                    const msg = payload?.message ?? payload?.Message ?? payload;
                    const msgId = msg?.id ?? msg?.messageId;
                    const senderId = Number(msg?.senderId ?? msg?.SenderId ?? 0);
                    const myId = Number(currentUserIdRef.current);
                    const isMine = myId && senderId === myId;

                    if (msgId && processedMessageIds.has(String(msgId))) return;
                    if (msgId) processedMessageIds.add(String(msgId));

                    if (isMine) return;

                    const isActive = cid === Number(activeConversationIdRef.current);
                    if (isActive) return;

                    const type = normalizeMessageType(msg?.messageType ?? msg?.type);
                    let displayMessage = getMessagePreview(type, msg?.content);

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
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', handlePageHide);
        };
    }, [
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
    ]);
}
