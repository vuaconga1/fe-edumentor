import React, { useEffect, useRef, useState, useCallback } from "react";
import { HiArrowLeft } from "react-icons/hi";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ActionPopup from "./ActionPopup";
import ActionModals from "./ActionModals";
import WorkSessionPinnedBar from "./WorkSessionPinnedBar";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

export default function ChatWindow({
  conversation,
  messages = [],
  onSend,
  onSendImage,
  onBack,
  currentUserId,
  workSession,
  workContext, // ✅ Added to check orderId
  onStartWork,
  onPauseWork,
  onEndWork,
  onCompleteOrder, // ✅ Added
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isFirstLoad = useRef(true);
  const prevScrollHeight = useRef(0);

  // Keep your existing input UI (plus button + modals) intact
  const [text, setText] = useState("");
  const [openActions, setOpenActions] = useState(false);
  const [modalType, setModalType] = useState(null);

  // Scroll to bottom on first load or new message (only if already near bottom)
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;

    if (isFirstLoad.current) {
      el.scrollTop = el.scrollHeight;
      isFirstLoad.current = false;
      return;
    }

    // Check if user is near bottom (within 150px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset first load flag when conversation changes
  useEffect(() => {
    isFirstLoad.current = true;
  }, [conversation?.id]);

  // Restore scroll position after loading older messages
  useEffect(() => {
    if (!loadingMore && prevScrollHeight.current > 0 && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [loadingMore, messages]);

  // Infinite scroll: load older messages on scroll to top
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loadingMore || !hasMore) return;
    const el = scrollContainerRef.current;

    if (el.scrollTop < 80) {
      prevScrollHeight.current = el.scrollHeight;
      onLoadMore?.();
    }
  }, [loadingMore, hasMore, onLoadMore]);

  // Empty state when no conversation selected
  if (!conversation) {
    return (
      <div className="hidden md:flex flex-col h-full items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-neutral-400 dark:text-neutral-500 text-center">
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose from your conversations to start chatting</p>
        </div>
      </div>
    );
  }

  const list = Array.isArray(messages) ? messages : [];

  const participantAvatarSrc =
    normalizeAvatarUrl(conversation?.participantAvatar) ||
    buildDefaultAvatarUrl({
      id: conversation?.participantId || conversation?.participantUserId,
      email: conversation?.participantEmail,
      fullName: conversation?.participantName,
    });

  const handleSubmitText = (e) => {
    e.preventDefault();
    const t = (text ?? "").trim();
    if (!t) return;
    onSend?.(t);
    setText("");
  };

  return (
    <div className="relative flex flex-col h-full min-h-0">
      {/* ✅ Work pinned bar (top-middle overlay inside chat window) */}
      {workSession && workSession.status !== "idle" && (
        <WorkSessionPinnedBar
          status={workSession.status}
          startTime={workSession.startTime}
          totalMinutes={workSession.totalMinutes}
          pendingActionType={workSession.pendingActionType}
          onPause={onPauseWork}
          onEnd={onEndWork}
        />
      )}

      {/* Header */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Back button - mobile only */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          )}

          <img
            src={participantAvatarSrc}
            alt={conversation?.participantName || "User"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = buildDefaultAvatarUrl({
                id: conversation?.participantId || conversation?.participantUserId,
                email: conversation?.participantEmail,
                fullName: conversation?.participantName,
              });
            }}
          />

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-neutral-900 dark:text-white truncate">
              {conversation?.participantName || "Chat"}
            </div>
            <div className="text-xs text-neutral-500">
              {conversation?.isParticipantOnline ? "Online" : "Offline"}
            </div>
          </div>

          {/* ✅ Complete Order button - show when there's an active order */}
          <div className="flex items-center gap-2">
            {workContext?.orderId && (
              <button
                type="button"
                onClick={onCompleteOrder}
                className="h-9 px-3 rounded-lg bg-green-600 text-white text-sm font-semibold
                           hover:bg-green-700 active:opacity-90 transition-colors"
              >
                Hoàn thành đơn hàng
              </button>
            )}

            {/* If session exists, user controls from pinned bar.
                (We don't duplicate pause/end buttons here to keep UI clean.) */}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3 bg-white dark:bg-neutral-950"
      >
        {/* Loading older messages spinner */}
        {loadingMore && (
          <div className="flex justify-center py-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && list.length > 0 && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-neutral-400">Đã hiển thị tất cả tin nhắn</span>
          </div>
        )}

        {list.map((msg, index) => {
          const mine = !!msg.isOwn;
          return (
            <div key={msg.id ?? index} className="space-y-1">
              {!!msg.senderName && (
                <div
                  className={`text-xs font-semibold text-neutral-700 dark:text-neutral-300 ${mine ? "text-right" : "text-left"
                    }`}
                >
                  {/* {msg.senderName} */}
                </div>
              )}
              <MessageBubble message={msg} isMine={mine} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input (keep existing feature: + popup, image/file modal, text send) */}
      <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 p-3 relative">
        <ActionPopup
          isOpen={openActions}
          onClose={() => setOpenActions(false)}
          onAction={(type) => {
            if (type === "complete-order") {
              onCompleteOrder?.();
              setOpenActions(false);
              return;
            }
            setModalType(type);
            setOpenActions(false);
          }}
        />

        <ActionModals
          isOpen={!!modalType}
          type={modalType}
          onClose={() => setModalType(null)}
          onSubmit={(type, data) => {
            if (type === "image") {
              onSendImage?.(data); // { file, desc }
            }
            setModalType(null);
          }}
        />

        <form onSubmit={handleSubmitText} className="flex items-center gap-2">
          {/* + button */}
          <button
            type="button"
            onClick={() => setOpenActions((v) => !v)}
            className="h-10 w-10 rounded-xl border border-neutral-300 dark:border-neutral-700
                 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            +
          </button>

          <input
            className="flex-1 h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700
                 bg-transparent outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />

          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-blue-600 text-white font-semibold"
          >
            Send
          </button>
        </form>

        {/* Keep MessageInput if you still use it elsewhere.
            If MessageInput is the main input component in your project,
            you can remove the custom <form> above and use MessageInput only.
            Right now we keep YOUR current UI as in the file you provided. */}
        {/* <MessageInput onSend={onSend} onStartWork={onStartWork} /> */}
      </div>
    </div>
  );
}
