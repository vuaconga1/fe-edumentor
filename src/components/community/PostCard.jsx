import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, MoreVertical, UserPlus, UserCheck, Flag, Send, FileText, Download } from 'lucide-react';
import CommentSection from './CommentSection';
import SendProposalModal from './SendProposalModal';
import ReportPostModal from './ReportPostModal';
import { getRoleName } from '../../utils/userRole';
import { normalizeAvatarUrl, buildDefaultAvatarUrl, normalizeFileUrl } from '../../utils/avatar';
import { useAuth } from '../../context/AuthContext';
import communityApi from '../../api/communityApi';
import requestApi from '../../api/requestApi';

const PostCard = ({ post, onRefresh }) => {
  const { user: currentUser } = useAuth();
  const isMentor = currentUser?.role === 'Mentor' || currentUser?.role === 1;

  const {
    id,
    author = {},
    title = "",
    content = "",
    media = null,
    files = [],
    stats = { likes: 0, comments: 0 },
    createdAt = "",
    tags = [],
    categoryId = null,
    categoryName = null,
    proposalCount = 0,
    userInteraction = { isFollowing: false, isLiked: false }
  } = post || {};

  const [isFollowing, setIsFollowing] = useState(userInteraction.isFollowing || post.isFollowing || false);
  const [showComments, setShowComments] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasPendingProposal, setHasPendingProposal] = useState(false);
  const [checkingProposal, setCheckingProposal] = useState(false);
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

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await communityApi.unfollowUser(author.id);
      } else {
        await communityApi.followUser(author.id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleComments = () => setShowComments(!showComments);

  const handleMessage = () => {
    console.log(`Open chat with ${author.name}`);
  };

  const handleSendProposal = () => {
    setIsProposalModalOpen(true);
  };

  // Check for pending proposal when component mounts (for mentors only)
  useEffect(() => {
    const checkPendingProposal = async () => {
      if (!isMentor || !id) return;
      
      setCheckingProposal(true);
      try {
        let page = 1;
        let totalPages = 1;

        do {
          const res = await requestApi.getMyProposals(page, 50);
          const data = res?.data?.data;
          const items = data?.items || [];
          totalPages = data?.totalPages || 1;

          const pending = items.some((proposal) => {
            const postIdMatch = proposal?.postId === id || proposal?.communityPostId === id;
            const isPending = proposal?.status === 0 || 
                             proposal?.status === 'Pending' || 
                             proposal?.statusDisplay === 'Pending';
            return postIdMatch && isPending;
          });

          if (pending) {
            setHasPendingProposal(true);
            break;
          }
          page += 1;
        } while (page <= totalPages && page <= 5);
      } catch (err) {
        console.error('Check pending proposal failed:', err);
      } finally {
        setCheckingProposal(false);
      }
    };

    checkPendingProposal();
  }, [isMentor, id]);

  const handleProposalSubmit = async (proposalData) => {
    try {
      await communityApi.sendProposal(id, proposalData);
      setIsProposalModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error sending proposal:', error);
      throw error;
    }
  };

  // Format date with local timezone (server returns UTC)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Ensure the date is parsed as UTC - append 'Z' if not present
    let utcString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      utcString = dateString + 'Z';
    }
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
    
    // Show local date/time for older posts
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Check if current user is the author
  const isOwnPost = currentUser?.id === author.id;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-lg transition-all duration-300">

      {/* --- HEADER --- */}
      <div className="flex items-start justify-between mb-3 relative">
        <div className="flex items-center gap-3">
          <img
            src={normalizeAvatarUrl(author.avatarUrl || author.avatar) || buildDefaultAvatarUrl({ id: author.id, fullName: author.name })}
            alt={author.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-700"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = buildDefaultAvatarUrl({ id: author.id, fullName: author.name });
            }}
          />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                {author.name || "Unknown User"}
              </h3>

              {!isOwnPost && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 disabled:opacity-50
                    ${isFollowing
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                      : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:text-primary-400'}`}
                >
                  {isFollowing ? <><UserCheck size={14} /> <span>Following</span></> : <><UserPlus size={14} /> <span>Follow</span></>}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              {author.role != null && (
                <>
                  <span className="bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded text-primary-600 dark:text-primary-400 font-medium">
                    {typeof author.role === 'string' ? author.role : getRoleName(author.role)}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>{formatDate(createdAt)}</span>
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
                {!isOwnPost && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsReportModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <Flag size={16} /> Report
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- TITLE --- */}
      {title && (
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          {title}
        </h2>
      )}

      {/* --- CONTENT --- */}
      <div className="mb-3">
        <div 
          className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* --- CATEGORY & TAGS --- */}
      {(categoryName || (tags && tags.length > 0)) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Category badge - same style as hashtags */}
          {categoryName && (
            <span className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
              {categoryName}
            </span>
          )}
          {/* Hashtags */}
          {tags && tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* --- FILES (Images & Documents) --- */}
      {files && files.length > 0 && (
        <div className="mb-4 space-y-2">
          {/* Images */}
          {files.filter(f => f.fileType === 'image').length > 0 && (
            <div className={`grid gap-2 ${files.filter(f => f.fileType === 'image').length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {files.filter(f => f.fileType === 'image').map((file) => (
                <div key={file.id} className="rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 group cursor-pointer">
                  <img 
                    src={normalizeFileUrl(file.fileUrl)} 
                    alt={file.fileName || 'Post image'} 
                    className="w-full h-auto max-h-[400px] object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Documents */}
          {files.filter(f => f.fileType !== 'image').map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <FileText size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {file.fileName || 'Document'}
                </p>
                {file.fileSize && (
                  <p className="text-xs text-neutral-500">
                    {(file.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <a
                href={normalizeFileUrl(file.fileUrl)}
                download={file.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Download</span>
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Legacy media support */}
      {media && media.url && (
        <div className="mb-4 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800 group cursor-pointer">
          <img src={media.url} alt="Post content" className="w-full h-auto max-h-[400px] object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}

      {/* --- FOOTER ACTIONS --- */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">

        {/* NHÓM TRÁI: Comment & Share */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleComments}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${showComments ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400'}`}
          >
            <MessageCircle size={18} />
            <span className="font-medium">{stats.comments}</span>
          </button>


        </div>

        {/* NHÓM PHẢI: Proposal (Mentor only) */}
        <div className="flex items-center gap-1">
          {/* Send Proposal Button - Only for Mentors, not own post, and post author must be Student (role 0) */}
          {isMentor && !isOwnPost && (author.role === 'Student' || author.role === 0) && (
            <button
              onClick={handleSendProposal}
              disabled={hasPendingProposal || checkingProposal}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              title={hasPendingProposal ? "You already have a pending proposal" : "Send Proposal"}
            >
              {checkingProposal ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Checking...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span className="hidden sm:inline">{hasPendingProposal ? 'Proposal Sent' : 'Send Proposal'}</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {showComments && <CommentSection postId={id} />}

      {/* Send Proposal Modal */}
      <SendProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onSubmit={handleProposalSubmit}
        postTitle={title}
        authorName={author.name}
        postId={id}
      />

      {/* Report Post Modal */}
      <ReportPostModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        post={post}
      />
    </div>
  );
};

export default PostCard;