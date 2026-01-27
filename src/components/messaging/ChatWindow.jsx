import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
export default function ChatWindow({ conversation, messages = [], onSend }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const list = Array.isArray(messages) ? messages : [];
  const participantAvatarSrc =
    normalizeAvatarUrl(conversation?.participantAvatar) ||
    buildDefaultAvatarUrl({
      id: conversation?.participantId || conversation?.participantUserId,
      email: conversation?.participantEmail,
      fullName: conversation?.participantName
    });
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={participantAvatarSrc}
            alt={conversation?.participantName || "User"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = buildDefaultAvatarUrl({
                id: conversation?.participantId || conversation?.participantUserId,
                email: conversation?.participantEmail,
                fullName: conversation?.participantName
              });
            }}
          />

          <div className="min-w-0">
            <div className="font-semibold text-neutral-900 dark:text-white truncate">
              {conversation?.participantName || "Chat"}
            </div>
            <div className="text-xs text-neutral-500">
              {conversation?.isParticipantOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3 bg-white dark:bg-neutral-950">
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

      {/* Input */}
      <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800">
        <MessageInput onSend={onSend} />
      </div>
    </div>
  );
}
