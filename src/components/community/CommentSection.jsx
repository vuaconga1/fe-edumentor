import React, { useState } from 'react';
import { Send, MoreHorizontal, Smile } from 'lucide-react';

const CommentSection = ({ postId }) => {
  // Mock Data cho comment (Sau này lấy từ API dựa vào postId)
  const [comments, setComments] = useState([
    {
      id: 1,
      user: {
        name: "Alex Johnson",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        role: "Developer"
      },
      content: "Great post! I've been struggling with this for a while. Thanks for sharing.",
      time: "1 hour ago"
    },
    {
      id: 2,
      user: {
        name: "Maria Garcia",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        role: "Designer"
      },
      content: "Could you share more about the tool you mentioned in the second paragraph?",
      time: "30 mins ago"
    }
  ]);

  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Giả lập thêm comment mới
    const newComment = {
      id: Date.now(),
      user: {
        name: "You", // Tên user hiện tại
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
        role: "Student"
      },
      content: inputValue,
      time: "Just now"
    };

    setComments([newComment, ...comments]); // Đưa comment mới lên đầu
    setInputValue("");
  };

  return (
    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
      
      {/* --- INPUT FORM --- */}
      <div className="flex gap-3 mb-6">
        <img 
          src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" 
          alt="My Avatar" 
          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 mt-1"
        />
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="relative group">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[50px]"
              rows="1"
            />
            
            {/* Action Buttons inside Input */}
            <div className="absolute right-2 bottom-2.5 flex items-center gap-1">
               <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full transition-colors">
                  <Smile size={18} />
               </button>
               <button 
                 type="submit"
                 disabled={!inputValue.trim()}
                 className={`p-1.5 rounded-full transition-colors ${inputValue.trim() ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer' : 'text-neutral-300 cursor-not-allowed'}`}
               >
                  <Send size={18} />
               </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- COMMENT LIST --- */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <img 
              src={comment.user.avatar} 
              alt={comment.user.name} 
              className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-800 mt-1"
            />
            <div className="flex-1">
              {/* Bubble Content */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl rounded-tl-none px-4 py-2.5 inline-block">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {comment.time}
                  </span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {comment.content}
                </p>
              </div>

              {/* Actions (Like/Reply) */}
              <div className="flex items-center gap-4 mt-1 ml-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Like</button>
                <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Reply</button>
              </div>
            </div>

            {/* More Option (Hidden by default, show on hover) */}
            <button className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-600 transition-all self-center">
               <MoreHorizontal size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;