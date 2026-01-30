export default function MessageBubble({ message, isMine }) {
  const senderName = message.senderName || "Unknown";

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      {!isMine && (
        <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
      )}

      <div
        className={`max-w-[65%] px-4 py-2 rounded-2xl text-sm shadow-sm
          ${isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}
        `}
      >
        {message.content}
      </div>

      <span className="text-[10px] text-gray-400 mt-1">
        {message.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : ""}
      </span>
    </div>
  );
}
