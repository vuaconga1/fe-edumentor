import React from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

const ChatWindow = ({ conversation, messages = [], currentUserId, onSend, onBack }) => {
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversation} onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {safeMessages.map((m) => (
          <MessageBubble
            key={m.id ?? `${m.createdAt ?? ""}-${m.content ?? ""}`}
            message={m}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      <MessageInput onSend={onSend} />
    </div>
  );
};

export default ChatWindow;
