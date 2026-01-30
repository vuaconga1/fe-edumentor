import React, { useState, useEffect } from 'react';
import { Send, MoreHorizontal, Smile, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from '../../utils/avatar';
import communityApi from '../../api/communityApi';

const CommentSection = ({ postId }) => {
  const { user: currentUser } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Fetch comments from API
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const res = await communityApi.getComments(postId);
        if (res?.data?.data) {
          // Map API response to component format
          const mappedComments = res.data.data.map(c => ({
            id: c.id,
            user: {
              id: c.authorId,
              name: c.authorName || 'Unknown',
              avatar: c.authorAvatar,
              isMentor: c.isAuthorMentor
            },
            content: c.content,
            time: formatTime(c.createdAt)
          }));
          setComments(mappedComments);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get current user's avatar
  const currentUserAvatar = currentUser?.avatar || buildDefaultAvatarUrl({
    id: currentUser?.id,
    email: currentUser?.email,
    fullName: currentUser?.name || 'User'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await communityApi.createComment(postId, { content: inputValue.trim() });
      if (res?.data?.data) {
        const c = res.data.data;
        const newComment = {
          id: c.id,
          user: {
            id: c.authorId,
            name: c.authorName || currentUser?.name || 'You',
            avatar: c.authorAvatar || currentUser?.avatar,
            isMentor: c.isAuthorMentor
          },
          content: c.content,
          time: 'Just now'
        };
        setComments([newComment, ...comments]);
        setInputValue("");
      }
    } catch (err) {
      console.error('Failed to create comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
      
      {/* --- INPUT FORM --- */}
      <div className="flex gap-3 mb-6">
        <img 
          src={currentUserAvatar}
          alt="My Avatar" 
          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 mt-1"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = buildDefaultAvatarUrl({ id: currentUser?.id, fullName: currentUser?.name });
          }}
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
                 disabled={!inputValue.trim() || submitting}
                 className={`p-1.5 rounded-full transition-colors ${inputValue.trim() && !submitting ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer' : 'text-neutral-300 cursor-not-allowed'}`}
               >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
               </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- COMMENT LIST --- */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-neutral-500 py-4">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <img 
              src={normalizeAvatarUrl(comment.user.avatarUrl || comment.user.avatar) || buildDefaultAvatarUrl({ id: comment.user.id, fullName: comment.user.name })} 
              alt={comment.user.name} 
              className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-800 mt-1"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = buildDefaultAvatarUrl({ id: comment.user.id, fullName: comment.user.name });
              }}
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
      )}
    </div>
  );
};

export default CommentSection;