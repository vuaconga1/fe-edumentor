import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Heart, Share2, MoreVertical, UserPlus, UserCheck, Flag, Bookmark, EyeOff, MessageSquare } from 'lucide-react';
import CommentSection from './CommentSection';

const PostCard = ({ post }) => {
  const { 
    id,
    author = {}, 
    content = "", 
    media = null, 
    stats = { likes: 0, comments: 0 }, 
    createdAt = "",
    userInteraction = { isFollowing: false, isLiked: false }
  } = post || {};

  const [isFollowing, setIsFollowing] = useState(userInteraction.isFollowing);
  const [isLiked, setIsLiked] = useState(userInteraction.isLiked);
  const [likeCount, setLikeCount] = useState(stats.likes);
  const [showComments, setShowComments] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLike = () => {
    if (isLiked) setLikeCount(prev => prev - 1);
    else setLikeCount(prev => prev + 1);
    setIsLiked(!isLiked);
  };

  const handleFollow = () => setIsFollowing(!isFollowing);
  const handleToggleComments = () => setShowComments(!showComments);
  
  const handleMessage = () => {
    console.log(`Open chat with ${author.name}`);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-lg transition-all duration-300">
      
      {/* --- HEADER --- */}
      <div className="flex items-start justify-between mb-3 relative">
        <div className="flex items-center gap-3">
          <img 
            src={author.avatar || "https://via.placeholder.com/40"} 
            alt={author.name} 
            className="w-10 h-10 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-700" 
          />
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                {author.name || "Unknown User"}
              </h3>

              <button 
                onClick={handleFollow}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200
                  ${isFollowing 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400' 
                    : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:text-primary-400'}`}
              >
                {isFollowing ? <><UserCheck size={14} /> <span>Following</span></> : <><UserPlus size={14} /> <span>Follow</span></>}
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              {author.role && (
                <span className="bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded text-primary-600 dark:text-primary-400 font-medium">
                  {author.role}
                </span>
              )}
              <span>•</span>
              <span>{createdAt}</span>
            </div>
          </div>
        </div>

        {/* 3 DOTS MENU */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
                <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-20 animate-in fade-in zoom-in duration-100 origin-top-right overflow-hidden">
                    <div className="py-1">
                        <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2">
                            <Bookmark size={16} /> Save Post
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2">
                            <EyeOff size={16} /> Hide Post
                        </button>
                        <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1"></div>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2">
                            <Flag size={16} /> Report
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="mb-3">
        <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {media && media.url && (
        <div className="mb-4 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 group cursor-pointer">
           <img src={media.url} alt="Post content" className="w-full h-auto max-h-[400px] object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}

      {/* --- FOOTER ACTIONS --- */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
        
        {/* NHÓM TRÁI: Like & Comment */}
        <div className="flex items-center gap-1">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-red-500'}`}
          >
            <Heart size={18} className={isLiked ? "fill-current" : ""} /> 
            <span className="font-medium">{likeCount}</span>
          </button>
          
          <button 
            onClick={handleToggleComments} 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${showComments ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
          >
            <MessageCircle size={18} /> 
            <span className="font-medium">{stats.comments}</span>
          </button>
        </div>

        {/* NHÓM PHẢI: Message & Share */}
        <div className="flex items-center gap-1">
          <button 
            onClick={handleMessage}
            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 rounded-lg transition-colors"
            title="Send Message"
          >
            <MessageSquare size={18} />
          </button>

          <button 
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Share Post"
          >
            <Share2 size={18} />
          </button>
        </div>

      </div>

      {showComments && <CommentSection postId={id} />}
    </div>
  );
};

export default PostCard;