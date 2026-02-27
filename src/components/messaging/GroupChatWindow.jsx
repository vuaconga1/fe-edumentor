import React, { useEffect, useRef, useState, useCallback } from "react";
import { HiArrowLeft, HiUserGroup, HiUsers, HiLogout, HiX } from "react-icons/hi";
import MessageBubble from "./MessageBubble";
import ActionPopup from "./ActionPopup";
import ActionModals from "./ActionModals";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

export default function GroupChatWindow({
  group,
  messages = [],
  onSend,
  onSendImage,
  onBack,
  currentUserId,
  onLeaveGroup,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [text, setText] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isFirstLoad = useRef(true);
  const prevScrollHeight = useRef(0);
  
  // For file/image upload
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

  // Reset first load flag when group changes
  useEffect(() => {
    isFirstLoad.current = true;
  }, [group?.id]);

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

  // Empty state when no group selected
  if (!group) {
    return (
      <div className="hidden md:flex flex-col h-full items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-neutral-400 dark:text-neutral-500 text-center">
          <HiUserGroup className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a group</p>
          <p className="text-sm mt-1">Choose from your groups to start chatting</p>
        </div>
      </div>
    );
  }

  const list = Array.isArray(messages) ? messages : [];
  const isAdmin = group?.mentorId === currentUserId;

  const handleSubmitText = (e) => {
    e.preventDefault();
    const t = (text ?? "").trim();
    if (!t) return;
    onSend?.(t);
    setText("");
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await onLeaveGroup?.(group.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          )}

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <HiUserGroup className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-neutral-900 dark:text-white truncate">
              {group?.name || "Group Chat"}
            </div>
            <div className="text-xs text-neutral-500 flex items-center gap-1">
              <HiUsers className="w-3 h-3" />
              {group?.memberCount || group?.members?.length || 0} members
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Leave group (not for admin) */}
            {!isAdmin && (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group/btn"
                title="Leave group"
              >
                <HiLogout className="w-5 h-5 text-neutral-500 group-hover/btn:text-red-500 transition-colors" />
              </button>
            )}

            {/* Show members */}
            <button
              onClick={() => setShowMembers(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="View members"
            >
              <HiUsers className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
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
            <span className="text-xs text-neutral-400">All messages displayed</span>
          </div>
        )}

        {list.length === 0 && !loadingMore ? (
          <div className="flex items-center justify-center h-full text-neutral-400">
            <div className="text-center">
              <HiUserGroup className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          list.map((msg, index) => {
            if (msg.messageType === "System" || msg.messageType === 3 || msg.type === "system") {
              return (
                <div key={msg.id ?? index} className="flex justify-center my-2">
                  <div className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs text-neutral-500 dark:text-neutral-400 shadow-sm">
                    {msg.content}
                  </div>
                </div>
              );
            }

            const mine = msg.senderId === currentUserId || msg.isOwn;
            return (
              <div key={msg.id ?? index} className="space-y-1">
                <MessageBubble message={msg} isMine={mine} />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 p-3 relative">
        <ActionPopup
          isOpen={openActions}
          onClose={() => setOpenActions(false)}
          onAction={(type) => {
            setModalType(type);
            setOpenActions(false);
          }}
          hideWorkActions={true}
        />

        <ActionModals
          isOpen={!!modalType}
          type={modalType}
          onClose={() => setModalType(null)}
          onSubmit={(type, data) => {
            if (type === "image" || type === "file") {
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
                 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex-shrink-0"
          >
            +
          </button>

          <input
            className="flex-1 h-10 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700
                       bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-10 px-4 rounded-xl bg-blue-600 text-white font-semibold
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>

      {/* ====== Leave Group Confirm Dialog ====== */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              Leave Group
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to leave <span className="font-semibold">"{group.name}"</span>?
              You will no longer be able to see new messages in this group.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                disabled={leaving}
                className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300
                           hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700
                           disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
              >
                {leaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Leaving...
                  </>
                ) : (
                  "Leave Group"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Members Sidebar ====== */}
      {showMembers && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowMembers(false)}
          />
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col animate-slide-in-right">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                Members ({group?.members?.length || group?.memberCount || 0})
              </h3>
              <button
                onClick={() => setShowMembers(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <HiX className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto py-2">
              {(group?.members || []).map((member) => {
                const avatarUrl = member.avatarUrl
                  ? normalizeAvatarUrl(member.avatarUrl)
                  : buildDefaultAvatarUrl(member.userName || "U");

                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <img
                      src={avatarUrl}
                      alt={member.userName}
                      className="w-10 h-10 rounded-full object-cover bg-neutral-200"
                      onError={(e) => {
                        e.target.src = buildDefaultAvatarUrl(member.userName || "U");
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-neutral-900 dark:text-white truncate">
                        {member.userName || "Unknown"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {member.role === "Admin" ? "Administrator" : "Member"}
                      </p>
                    </div>
                    {member.role === "Admin" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
