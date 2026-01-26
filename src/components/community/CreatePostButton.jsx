import React from 'react';
import { Plus, PenSquare } from 'lucide-react';

/**
 * CreatePostButton - Nút tạo bài viết mới
 */
const CreatePostButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 group"
    >
      <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
      <span>Create New Post</span>
      <PenSquare size={18} className="opacity-70" />
    </button>
  );
};

export default CreatePostButton;
