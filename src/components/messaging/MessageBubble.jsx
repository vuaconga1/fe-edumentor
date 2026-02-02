import React from "react";
import { FileIcon, ExternalLink } from "lucide-react";

export default function MessageBubble({ message, isMine }) {
  const senderName = message.senderName || "Unknown";
  // 0: Text, 1: Image, 2: File
  const type = message.messageType ?? 0;

  const renderContent = () => {
    switch (type) {
      case 1: // Image
        return (
          <div className="group relative">
            <img
              src={message.content}
              alt="Sent image"
              className="rounded-lg max-w-full sm:max-w-[280px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(message.content, "_blank")}
            />
          </div>
        );
      case 2: // File
        return (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-1 ${isMine ? "text-white" : "text-gray-900"}`}
          >
            <div className={`p-2 rounded-lg ${isMine ? "bg-white/20" : "bg-white"}`}>
              <FileIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="trancate font-medium text-sm hover:underline underline-offset-2">
                {message.fileName || "Attached File"}
              </p>
              {message.fileSize > 0 && (
                <p className={`text-xs ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                  {(message.fileSize / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </a>
        );
      default: // Text
        return <div className="whitespace-pre-wrap break-words">{message.content}</div>;
    }
  };

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      {!isMine && (
        <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
      )}

      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm transition-all
          ${isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}
          ${type === 1 ? "!p-1 bg-transparent shadow-none" : ""}
        `}
      >
        {renderContent()}
      </div>

      <span className="text-[10px] text-gray-400 mt-1 select-none">
        {message.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : ""}
      </span>
    </div>
  );
}
