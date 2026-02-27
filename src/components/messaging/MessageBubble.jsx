import React from "react";
import { FileIcon, ExternalLink, Info } from "lucide-react";
import { formatTime } from "../../utils/dateUtils";

export default function MessageBubble({ message, isMine }) {
  const senderName = message?.senderName || "Unknown";

  // Handle both number and string messageType
  // C# enum: Text=0, File=1, Image=2, System=3
  const rawType = message?.messageType ?? 0;
  let type;
  if (typeof rawType === 'string') {
    // Backend trả về dạng string enum name
    if (rawType === 'Image') type = 2;
    else if (rawType === 'File') type = 1;
    else if (rawType === 'System') type = 3;
    else if (rawType === 'Text') type = 0;
    else type = Number(rawType) || 0;
  } else {
    type = Number(rawType);
  }

  // System message (type=3): centered, special style
  if (type === 3) {
    const content = String(message?.content ?? "");
    return (
      <div className="flex justify-center py-1.5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                        bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30
                        text-xs text-blue-700 dark:text-blue-300 max-w-[85%] text-center">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{content}</span>
        </div>
      </div>
    );
  }
  
  const content = String(message?.content ?? "");
  
  // Check if content is a URL pointing to uploads
  const isUrl = /^https?:\/\//i.test(content) || content.startsWith("/uploads/");
  
  // Check if URL has image extension (fallback for old messages with wrong messageType)
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;
  const hasImageExtension = imageExtensions.test(content);
  
  // ✅ Coi là ảnh nếu:
  // - messageType === 2 (Image) VÀ là URL, HOẶC
  // - URL có đuôi ảnh (fallback cho tin nhắn cũ bị sai messageType)
  const isImage = (type === 2 && isUrl) || (isUrl && hasImageExtension);

  // File: messageType === 1 VÀ là URL VÀ KHÔNG phải ảnh
  const isFile = type === 1 && isUrl && !hasImageExtension;

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      {!isMine && (
        <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
      )}
      {isImage ? (
        <img
          src={content}
          alt="chat"
          className={`max-w-[280px] rounded-2xl border border-neutral-200 dark:border-neutral-700 ${isMine ? "rounded-br-sm" : "rounded-bl-sm"
            }`}
        />
      ) : isFile ? (
        <a
          href={content}
          target="_blank"
          rel="noreferrer"
          className={`max-w-[65%] px-4 py-3 rounded-2xl text-sm shadow-sm border bg-white dark:bg-neutral-900
      hover:bg-neutral-50 dark:hover:bg-neutral-800 ${isMine ? "rounded-br-sm" : "rounded-bl-sm"
            }`}
        >
          📎 {message.fileName || "Download file"}
          {message.fileSize ? (
            <div className="text-xs text-neutral-500 mt-1">
              {(message.fileSize / 1024).toFixed(1)} KB
            </div>
          ) : null}
        </a>
      ) : (
        <div
          className={`max-w-[65%] px-4 py-2 rounded-2xl text-sm shadow-sm whitespace-pre-wrap break-words
      ${isMine
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }
    `}
        >
          {content}
        </div>
      )}


      <span className="text-[10px] text-gray-400 mt-1">
        {message?.createdAt ? formatTime(message.createdAt) : ""}
      </span>
    </div>
  );
}
