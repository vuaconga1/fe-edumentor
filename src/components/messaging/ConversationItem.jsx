import React from "react";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

const ConversationItem = ({ conversation, isActive, onClick }) => {

  const {
    name,
    avatar,
    lastMessage,
    lastMessageAt,
    lastMessageSenderName, // 👈 thêm field này
    unread,
    isOnline
  } = conversation;
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
            className={`font-semibold text-sm truncate ${isActive
              ? "text-blue-700 dark:text-blue-300"
              : "text-gray-900 dark:text-white"
              }`}
          >
            {name}
          </h3>

          <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">
            {lastMessageAt
              ? new Date(lastMessageAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })
              : ""}
          </span>
        </div>

        {/* Sender + tin nhắn cuối */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-sm truncate pr-1 ${unread > 0
              ? "font-semibold text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400 font-normal"
              }`}
          >
            {lastMessageSenderName && (
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {lastMessageSenderName}:{" "}
              </span>
            )}
            {lastMessage || ""}
          </p>

          {unread > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
