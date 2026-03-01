import React, { useEffect, useRef, useState } from "react";
import { Plus, Send } from "lucide-react";
import ActionPopup from "./ActionPopup";
import ActionModals from "./ActionModals";

/**
 * Props:
 * - onSend: (text: string) => void | Promise<void>
 *  * - onStartWork: () => void | Promise<void>
 */
export default function MessageInput({ onSend, onStartWork }) {
  const [message, setMessage] = useState("");
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendText = async () => {
    const text = message.trim();
    if (!text) return;

    try {
      await onSend?.(text);
      setMessage("");
      inputRef.current?.focus();
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleSelectAction = (actionType) => {
    setShowActionPopup(false);
    setActiveModal(actionType);
  };

  const handleSubmitAction = async (type, data) => {
    if (type === "start-work") {
      await onStartWork?.(data);
    }
    // nếu mày muốn gửi system message thì làm ở đây
    setActiveModal(null);
  };

  return (
    <div className="relative px-4 py-3 bg-white dark:bg-neutral-900 transition-colors">
      <ActionPopup
        isOpen={showActionPopup}
        onClose={() => setShowActionPopup(false)}
        onAction={handleSelectAction}
      />

      <ActionModals
        isOpen={!!activeModal}
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onSubmit={handleSubmitAction}
      />

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setShowActionPopup(!showActionPopup)}
          className={`
            flex-shrink-0 p-2.5 rounded-full transition-all duration-200
            ${showActionPopup
              ? "bg-blue-100 text-blue-600 rotate-45 dark:bg-blue-900/40 dark:text-blue-400"
              : "hover:bg-neutral-100 text-neutral-500 dark:hover:bg-neutral-800 dark:text-neutral-400"}
          `}
          title="Add action"
        >
          <Plus size={24} />
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full px-5 py-3 bg-neutral-100 dark:bg-neutral-950 border border-transparent focus:border-blue-500/50 rounded-2xl text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleSendText}
          disabled={!message.trim()}
          className={`
            flex-shrink-0 p-3 rounded-full transition-all duration-200 shadow-sm
            ${message.trim()
              ? "bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 active:scale-95"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"}
          `}
        >
          <Send size={20} className={message.trim() ? "ml-0.5" : ""} />
        </button>
      </div>
    </div>
  );
}
