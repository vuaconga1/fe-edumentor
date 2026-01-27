import React from 'react';
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';

const ChatHeader = ({ conversation, onBack }) => {
  if (!conversation) return null;

  const { name, avatar, isOnline } = conversation;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        
        {/* Back button: Only visible on Mobile */}
        <button 
          onClick={onBack}
          className="md:hidden p-2 -ml-2 text-neutral-500 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Avatar & Info */}
        <div className="relative">
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700"
          />
        </div>
        
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
            {name}
          </h3>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-neutral-800 rounded-full">
          <Phone size={20} />
        </button>
        <button className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-neutral-800 rounded-full">
          <Video size={22} />
        </button>
        <button className="p-2 text-neutral-500 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-full">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
