import React, { useMemo, useState } from "react";
import ConversationItem from "./ConversationItem";

const ConversationList = ({ conversations = [], activeConversationId, onSelectConversation }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = (c.name || "").toLowerCase();
      return name.includes(q);
    });
  }, [conversations, search]);

  const loading = !conversations;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-neutral-500">Loading...</div>
        ) : filtered.length ? (
          filtered.map((conversation) => {
            const id = conversation.conversationId ?? conversation.id;
            return (
              <ConversationItem
                key={id}
                conversation={conversation}
                isActive={activeConversationId === id}
                onClick={() => onSelectConversation(id)} // ✅ đúng: truyền id
              />
            );
          })
        ) : (
          <div className="p-8 text-center text-neutral-500">No conversations found</div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
