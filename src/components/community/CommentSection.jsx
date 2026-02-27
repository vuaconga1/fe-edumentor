import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MoreHorizontal, Smile, Loader2, CornerDownRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from '../../utils/avatar';
import communityApi from '../../api/communityApi';
import { on, joinPostRoom, leavePostRoom, isConnected, startChatHub } from '../../signalr/chatHub';

// Unicode emoji picker data
const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😊', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '👏', '💪', '🙏', '😎'];

const CommentSection = ({ postId }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isCurrentUserMentor = currentUser?.role === 'Mentor' || currentUser?.role === 1;

  // Navigate to user profile
  const handleCommentAuthorClick = (commentUser) => {
    if (!commentUser?.id || commentUser.id === currentUser?.id) return;
    const basePath = isCurrentUserMentor ? '/mentor' : '/student';
    navigate(`${basePath}/user/${commentUser.id}`);
  };

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // Recursive function to map comment tree
  const mapComment = (c) => ({
    id: c.id,
    user: {
      id: c.authorId,
      name: c.authorName || 'Unknown',
      avatar: c.authorAvatar,
      isMentor: c.isAuthorMentor
    },
    content: c.content,
    time: formatTime(c.createdAt),
    parentCommentId: c.parentCommentId,
    replies: c.replies ? c.replies.map(mapComment) : []
  });

  // Fetch comments from API with pagination
  const fetchComments = async (page = 1, append = false) => {
    if (!postId) return;
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await communityApi.getComments(postId, page, PAGE_SIZE);
      const pagedData = res?.data?.data;
      if (pagedData) {
        const items = pagedData.items || pagedData;
        const mappedComments = (Array.isArray(items) ? items : []).map(mapComment);
        setComments(prev => append ? [...prev, ...mappedComments] : mappedComments);
        setCurrentPage(pagedData.pageNumber || page);
        setTotalPages(pagedData.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, [postId]);

  // Real-time SignalR: join post room & listen for new comments / deletions
  useEffect(() => {
    if (!postId) return;

    let unsubNew, unsubDelete;

    // Ensure hub is connected, then join the post room
    const connectAndJoin = async () => {
      try {
        if (!isConnected()) {
          const token = localStorage.getItem('token');
          const baseUrl = import.meta.env.VITE_API_BASE_URL;
          if (token && baseUrl) {
            await startChatHub(baseUrl, token);
          }
        }
        if (isConnected()) {
          await joinPostRoom(postId);
        }
      } catch (err) {
        console.warn('Failed to connect/join post room:', err);
      }
    };
    connectAndJoin();

    // Listen for new comments
    unsubNew = on('NewComment', (comment) => {
      if (!comment) return;
      const mapped = mapComment(comment);
      setComments((prev) => {
        // Avoid duplicates
        const exists = prev.some((c) => c.id === mapped.id) ||
          prev.some((c) => c.replies?.some((r) => r.id === mapped.id));
        if (exists) return prev;

        if (mapped.parentCommentId) {
          // It's a reply — add to parent's replies
          return prev.map((c) => {
            if (c.id === mapped.parentCommentId) {
              return { ...c, replies: [...(c.replies || []), mapped] };
            }
            return c;
          });
        }
        // It's a root comment — prepend
        return [mapped, ...prev];
      });
    });

    // Listen for comment deletions
    unsubDelete = on('CommentDeleted', (data) => {
      if (!data?.commentId) return;
      setComments((prev) =>
        prev
          .filter((c) => c.id !== data.commentId)
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => r.id !== data.commentId),
          }))
      );
    });

    return () => {
      // Cleanup: leave room & unsubscribe
      if (isConnected()) {
        leavePostRoom(postId).catch(() => {});
      }
      unsubNew?.();
      unsubDelete?.();
    };
  }, [postId]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchComments(currentPage + 1, true);
    }
  };

  // Format time with local timezone
  const formatTime = (dateString) => {
    if (!dateString) return '';
    // Backend returns UTC time without 'Z' suffix — append it so JS parses correctly
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Show local date for older comments
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
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
      const payload = { 
        content: inputValue.trim(),
        parentCommentId: replyingTo?.id || null 
      };
      const res = await communityApi.createComment(postId, payload);
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
          time: 'Just now',
          parentCommentId: c.parentCommentId || null
        };
        
        if (replyingTo) {
          // Add as reply
          setComments(prevComments => prevComments.map(comment => {
            if (comment.id === replyingTo.id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment]
              };
            }
            return comment;
          }));
        } else {
          setComments([newComment, ...comments]);
        }
        setInputValue("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Failed to create comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setInputValue(`@${comment.user.name} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setInputValue("");
  };

  const insertEmoji = (emoji) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Recursive comment rendering
  const renderComment = (comment, depth = 0) => {
    const isNested = depth > 0;
    const avatarSize = isNested ? 'w-6 h-6' : 'w-8 h-8';
    const bubbleRounded = isNested ? 'rounded-xl' : 'rounded-2xl rounded-tl-none';
    const textSize = isNested ? 'text-xs' : 'text-sm';
    const nameSize = isNested ? 'text-xs' : 'text-sm';
    const marginLeft = isNested ? 'ml-4' : '';

    return (
      <div key={comment.id} className={`flex gap-${isNested ? '2' : '3'} group ${marginLeft}`}>
        <img 
          src={normalizeAvatarUrl(comment.user.avatarUrl || comment.user.avatar) || buildDefaultAvatarUrl({ id: comment.user.id, fullName: comment.user.name })} 
          alt={comment.user.name} 
          className={`${avatarSize} rounded-full object-cover border border-neutral-200 dark:border-neutral-800 mt-1 ${comment.user.id !== currentUser?.id ? 'cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all' : ''}`}
          onClick={comment.user.id !== currentUser?.id ? () => handleCommentAuthorClick(comment.user) : undefined}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = buildDefaultAvatarUrl({ id: comment.user.id, fullName: comment.user.name });
          }}
        />
        <div className="flex-1">
          {/* Bubble Content */}
          <div className={`bg-neutral-50 dark:bg-neutral-800/50 ${bubbleRounded} px-${isNested ? '3' : '4'} py-2.5 inline-block`}>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`${nameSize} font-semibold text-neutral-900 dark:text-white ${comment.user.id !== currentUser?.id ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors' : ''}`}
                onClick={comment.user.id !== currentUser?.id ? () => handleCommentAuthorClick(comment.user) : undefined}
              >
                {comment.user.name}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {comment.time}
              </span>
            </div>
            <p className={`${textSize} text-neutral-700 dark:text-neutral-300 leading-relaxed`}>
              {comment.content}
            </p>
          </div>

          {/* Actions (Reply only) */}
          <div className="flex items-center gap-4 mt-1 ml-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <button 
              onClick={() => handleReply(comment)}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Reply
            </button>
          </div>

          {/* Nested Replies - Recursive */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l-2 border-neutral-100 dark:border-neutral-800 pl-4">
              {comment.replies.map((reply) => renderComment(reply, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
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
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <CornerDownRight size={14} className="text-blue-500" />
              <span className="text-blue-600 dark:text-blue-400">Replying to {replyingTo.user.name}</span>
              <button 
                onClick={cancelReply}
                className="ml-auto text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative group">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[50px]"
              rows="1"
            />
            
            {/* Action Buttons inside Input */}
            <div className="absolute right-2 bottom-2.5 flex items-center gap-1">
               <div className="relative">
                 <button 
                   type="button" 
                   onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                   className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full transition-colors"
                   title="Add emoji"
                 >
                   <Smile size={18} />
                 </button>
                 {showEmojiPicker && (
                   <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-50 min-w-[200px]">
                     <div className="grid grid-cols-8 gap-1">
                       {EMOJI_LIST.map((emoji, idx) => (
                         <button
                           key={idx}
                           type="button"
                           onClick={() => insertEmoji(emoji)}
                           className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-base transition-colors"
                         >
                           {emoji}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
               <button 
                 type="submit"
                 disabled={!inputValue.trim() || submitting}
                 className={`p-1.5 rounded-full transition-colors ${inputValue.trim() && !submitting ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer' : 'text-neutral-300 cursor-not-allowed'}`}
                 title="Send comment"
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
          {comments.map((comment) => renderComment(comment))}
          {currentPage < totalPages && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loadingMore ? (
                <><Loader2 size={16} className="animate-spin" /> Loading...</>
              ) : (
                'Load more comments'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;