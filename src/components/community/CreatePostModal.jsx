import React, { useState, useEffect } from 'react';
import { X, Image, Paperclip, Smile, EyeOff, User } from 'lucide-react';

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Reset content when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent('');
      setIsAnonymous(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit({ content, isAnonymous, timestamp: new Date() });
    onClose();
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Create Post</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex gap-3">
             {/* Avatar - shows anonymous icon or user avatar */}
             {isAnonymous ? (
               <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center border-2 border-neutral-100 dark:border-neutral-700">
                 <EyeOff size={20} className="text-neutral-500 dark:text-neutral-400" />
               </div>
             ) : (
               <img 
                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                 alt="User" 
                 className="w-10 h-10 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-700"
               />
             )}
             <div className="flex-1">
               {/* Username display */}
               <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                 {isAnonymous ? 'Anonymous' : 'You'}
               </p>
               <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-28 bg-transparent border-none focus:ring-0 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 resize-none text-base leading-relaxed p-0"
                  autoFocus
               />
             </div>
          </div>
          
          {/* Image Upload Area */}
          <div className="mt-4 p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center text-neutral-400 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer group">
             <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-2 group-hover:scale-110 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-all">
                <Image size={24} className="text-neutral-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
             </div>
             <span className="text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Add Photos/Videos</span>
          </div>

          {/* Anonymous Toggle */}
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isAnonymous ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                  <EyeOff size={18} className={`transition-colors ${isAnonymous ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500'}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Post Anonymously</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Your name won't be visible to others</p>
                </div>
              </div>
              {/* Toggle Switch */}
              <div className={`relative w-11 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1">
            <button className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 rounded-xl transition-colors" title="Attach image">
              <Image size={20} />
            </button>
            <button className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 rounded-xl transition-colors" title="Attach file">
              <Paperclip size={20} />
            </button>
            <button className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 rounded-xl transition-colors" title="Emoji">
              <Smile size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!content.trim()}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg
                ${content.trim() 
                  ? 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl shadow-primary-600/25 cursor-pointer hover:scale-105 active:scale-100' 
                  : 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed shadow-none'}`}
            >
              Post
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreatePostModal;