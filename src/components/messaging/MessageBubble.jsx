import React from "react";

export default function MessageBubble({ message, currentUserId }) {
  const senderId =
    message.senderId ??
    message.sender?.id ??
    message.userId;

  const isMine = Number(senderId) === Number(currentUserId);

  return (
    <div className={`w-full flex ${isMine ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`
          max-w-[70%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap
          ${isMine
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-md"
          }
        `}
      >
        {message.content ?? message.text ?? ""}
        <div className={`mt-1 text-[10px] opacity-70 ${isMine ? "text-white" : ""}`}>
          {message.sentAt
            ? new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""}
        </div>
      </div>
    </div>
  );
}
