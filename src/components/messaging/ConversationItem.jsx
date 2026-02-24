import React from "react";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import { formatTime } from "../../utils/dateUtils";

const ConversationItem = ({ conversation, isActive, onClick }) => {

  const {
    name,
    avatar,
    lastMessage,
    lastMessageAt,
    lastMessageSenderName,
    unreadCount,
    isOnline
  } = conversation;

  const hasUnread = (unreadCount ?? 0) > 0;

  const rawAvatar =
    conversation?.participantAvatar || conversation?.avatar;
  const seed = {
    id: conversation?.participantId || conversation?.userId || conversation?.id,
    email: conversation?.participantEmail || conversation?.email,
    fullName: conversation?.name
  };

  const avatarSrc =
    normalizeAvatarUrl(rawAvatar) || buildDefaultAvatarUrl(seed);


  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center gap-3 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200
        ${isActive
          ? "bg-blue-50 dark:bg-blue-900/30"
          : hasUnread
            ? "bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
            : "hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-transparent"}
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarSrc}
          alt={name || "User"}
          className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-700"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = buildDefaultAvatarUrl(seed);
          }}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Tên conversation + giờ */}
        <div className="flex items-center justify-between mb-0.5">
          <h3
            className={`text-sm truncate ${
              isActive
                ? "font-semibold text-blue-700 dark:text-blue-300"
                : hasUnread
                  ? "font-bold text-gray-900 dark:text-white"
                  : "font-semibold text-gray-900 dark:text-white"
            }`}
          >
            {name}
          </h3>

          <span
            className={`text-[11px] flex-shrink-0 ${
              hasUnread
                ? "font-semibold text-blue-600 dark:text-blue-400"
                : "font-medium text-gray-400"
            }`}
          >
            {lastMessageAt ? formatTime(lastMessageAt) : ""}
          </span>
        </div>

        {/* Sender + tin nhắn cuối */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-[13px] truncate pr-1 ${
              hasUnread
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 font-normal"
            }`}
          >
            {lastMessageSenderName && (
              <span
                className={
                  hasUnread
                    ? "font-bold text-gray-800 dark:text-gray-200"
                    : "font-semibold text-gray-700 dark:text-gray-300"
                }
              >
                {lastMessageSenderName}:{" "}
              </span>
            )}
            {lastMessage || ""}
          </p>

          {hasUnread && (
            <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
