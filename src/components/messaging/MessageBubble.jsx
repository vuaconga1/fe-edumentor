import React from "react";
import { FileIcon, ExternalLink } from "lucide-react";

export default function MessageBubble({ message, isMine }) {
  const senderName = message?.senderName || "Unknown";


  const type = Number(message?.messageType ?? 0);
  const content = String(message?.content ?? "");
  // ✅ Chỉ coi là ảnh khi:
  // - messageType === 1
  // - content là URL hoặc /uploads...
  // - và có đuôi ảnh (tránh case "Mình đã upload file....")
  const isImage =
    type === 1 &&
    (/^https?:\/\//i.test(content) || content.startsWith("/uploads/")) &&
    /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(content);

  const isFile =
    type === 2 && (/^https?:\/\//i.test(content) || content.startsWith("/uploads/"));

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
        {message?.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          : ""}
      </span>
    </div>
  );
}
