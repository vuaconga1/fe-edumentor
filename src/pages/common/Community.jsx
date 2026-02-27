import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import communityApi from '../../api/communityApi';
import { useAuth } from '../../context/AuthContext';
import { buildDefaultAvatarUrl } from '../../utils/avatar';
import {
  HiSparkles,
  HiUsers,
  HiUserCircle,
  HiPlus,
  HiPencil,
  HiFire,
  HiSearch,
  HiRefresh,
  HiFilter,
  HiChevronDown
} from 'react-icons/hi';

// Animation hook
const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

const Community = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('foryou');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [headerRef, headerVisible] = useScrollAnimation();
  const { user: currentUser } = useAuth();

  // API state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Highlighted post from notification
  const [highlightedPostId, setHighlightedPostId] = useState(null);

  // Trending topics from API
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [hashtagFilter, setHashtagFilter] = useState(null);

  // Category & Hashtag filters for "For You" tab
  const [categories, setCategories] = useState([]);
  const [allHashtags, setAllHashtags] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);

  // New posts notification
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  // Get current user's avatar
  const currentUserAvatar = currentUser?.avatar || buildDefaultAvatarUrl({
    id: currentUser?.id,
    email: currentUser?.email,
    fullName: currentUser?.name || 'User'
  });

  // Fetch posts based on active tab
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const params = {
        pageNumber: pageNum,
        pageSize: 10,
        keyword: searchTerm || undefined,
        hashtag: hashtagFilter || undefined,
        categoryId: categoryFilter || undefined
      };

      switch (activeTab) {
        case 'following':
          response = await communityApi.getFollowingPosts(params);
          break;
        case 'myposts':
          response = await communityApi.getMyPosts(params);
          break;
        default:
          response = await communityApi.getPosts(params);
      }

      const data = response.data;

      // Handle different response formats:
      // - my-posts returns: { data: [...] } (array directly)
      // - other endpoints return: { data: { items: [...], totalPages: n } }
      let items;
      let totalPages = 1;

      if (activeTab === 'myposts') {
        // my-posts returns array directly in data.data
        items = Array.isArray(data.data) ? data.data : [];
        // No pagination info for my-posts, assume single page
        totalPages = items.length > 0 ? 1 : 0;
      } else {
        // Paginated response
        items = data.data?.items || data.items || [];
        totalPages = data.data?.totalPages || data.totalPages || 1;
      }

      if (append) {
        setPosts(prev => [...prev, ...items]);
      } else {
        setPosts(items);
      }

      setHasMore(pageNum < totalPages);
      setLastFetchTime(Date.now());
      setHasNewPosts(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, hashtagFilter, categoryFilter]);

  // Fetch trending hashtags
  const fetchTrendingHashtags = async () => {
    try {
      const res = await communityApi.getTrendingHashtags(6);
      if (res?.data?.data) {
        setTrendingTopics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load trending:', err);
    }
  };

  // Fetch categories and hashtags for filter
  const fetchCategoriesAndHashtags = async () => {
    try {
      const [catRes, hashRes] = await Promise.all([
        communityApi.getCategories(),
        communityApi.getHashtags()
      ]);
      // ...removed debug log...
      if (catRes?.data?.data) {
        setCategories(catRes.data.data);
      }
      if (hashRes?.data?.data) {
        setAllHashtags(hashRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories/hashtags:', err);
    }
  };

  // Helper to get category name
  const getCategoryName = (catId) => {
    if (!catId) return 'Category';
    const category = categories.find(c => c.id === catId);
    return category?.name || 'Category';
  };

  // Fetch trending on mount
  useEffect(() => {
    fetchTrendingHashtags();
    fetchCategoriesAndHashtags();
  }, []);

  // Handle postId from notification - fetch specific post and highlight it
  useEffect(() => {
    const postId = searchParams.get('postId');
    if (postId) {
      setHighlightedPostId(parseInt(postId));
      // Clear the URL param after processing
      setSearchParams({}, { replace: true });

      // Fetch the specific post detail and add to top of feed
      const fetchSpecificPost = async () => {
        try {
          const res = await communityApi.getPostDetail(postId);
          if (res?.data?.data) {
            const specificPost = res.data.data;
            setPosts(prev => {
              // Check if post already exists
              const exists = prev.some(p => p.id === specificPost.id);
              if (exists) {
                return prev;
              }
              return [specificPost, ...prev];
            });

            // Scroll to the post after a short delay
            setTimeout(() => {
              const postElement = document.getElementById(`post-${postId}`);
              if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
          }
        } catch (err) {
          console.error('Failed to fetch specific post:', err);
        }
      };

      fetchSpecificPost();
    }
  }, [searchParams, setSearchParams]);

  // Fetch on tab change, hashtagFilter change, categoryFilter change, or initial load
  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [activeTab, hashtagFilter, categoryFilter, fetchPosts]);

  // Clear filters when changing tabs
  useEffect(() => {
    setCategoryFilter(null);
    setHashtagFilter(null);
    setSearchTerm('');
  }, [activeTab]);

  // Poll for new posts every 30 seconds
  useEffect(() => {
    const checkNewPosts = async () => {
      if (activeTab !== 'foryou' || loading) return;

      try {
        const response = await communityApi.getPosts({ pageNumber: 1, pageSize: 1 });
        const latestPost = response.data?.data?.items?.[0];

        if (latestPost && posts.length > 0) {
          const latestPostTime = new Date(latestPost.createdAt?.endsWith?.('Z') ? latestPost.createdAt : latestPost.createdAt + 'Z').getTime();
          const currentFirstPostTime = new Date(posts[0].createdAt?.endsWith?.('Z') ? posts[0].createdAt : posts[0].createdAt + 'Z').getTime();

          if (latestPostTime > currentFirstPostTime) {
            setHasNewPosts(true);
          }
        }
      } catch (err) {
        console.error('Check new posts failed:', err);
      }
    };

    const interval = setInterval(checkNewPosts, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [activeTab, posts, loading]);

  // Handle hashtag click in trending
  const handleHashtagClick = (hashtag) => {
    if (hashtagFilter === hashtag) {
      setHashtagFilter(null); // Clear filter
    } else {
      setHashtagFilter(hashtag);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchPosts(1, false);
    }
  };

  // Load more
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handleCreatePost = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmitPost = async (postData) => {
    try {
      await communityApi.createPost(postData);
      // Refresh the posts list
      setPage(1);
      fetchPosts(1, false);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  };

  const tabs = [
    { id: 'foryou', label: 'For You', icon: HiSparkles },
    { id: 'following', label: 'Following', icon: HiUsers },
    { id: 'myposts', label: 'My Posts', icon: HiUserCircle },
  ];

  // Map API data to component format
  const mapPostData = (post) => ({
    id: post.id,
    author: {
      id: post.authorId,
      name: post.authorName || 'Unknown',
      avatar: post.authorAvatar || buildDefaultAvatarUrl({ id: post.authorId, fullName: post.authorName }),
      avatarUrl: post.authorAvatar, // Also include avatarUrl for compatibility
      role: post.authorRole || 'Student'
    },
    title: post.title,
    content: post.contentPreview || post.content, // Use contentPreview from list API, fallback to content
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isFollowing: post.isFollowing || false, // Add isFollowing from API
    files: post.files || [], // Add files from API
    categoryId: post.categoryId,
    categoryName: post.categoryName,
    stats: {
      likes: post.likeCount || 0,
      comments: post.commentCount || 0,
      shares: 0,
      views: 0
    },
    tags: post.hashtags || [],
    proposalCount: post.proposalCount || 0,
    hasProposals: (post.proposalCount || 0) > 0
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div
        ref={headerRef}
        className={`sticky top-0 sm:top-4 z-30 mx-0 sm:mx-4 mb-4 sm:mb-6 sm:rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b sm:border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <div className="px-3 sm:px-4 lg:px-6">
          {/* Title row */}
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">Community</h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">Connect, share and grow together</p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <HiSearch className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-28 sm:w-48 md:w-64 pl-8 sm:pl-10 pr-2 sm:pr-4 py-2 sm:py-2.5 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-full text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
              <button
                onClick={() => fetchPosts(1, false)}
                className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                title="Refresh"
              >
                <HiRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1 pb-2 sm:pb-3">
            {/* Tabs */}
            <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap ${isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                  >
                    <Icon className={`w-3.5 sm:w-4 h-3.5 sm:h-4 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filter dropdowns for "For You" tab */}
            {activeTab === 'foryou' && (
              <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-auto flex-shrink-0">
                {/* Category Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      if (!showCategoryDropdown) fetchCategoriesAndHashtags();
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowHashtagDropdown(false);
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg border transition-colors ${categoryFilter
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                  >
                    <HiFilter className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span className="hidden xs:inline max-w-[60px] sm:max-w-none truncate">
                      {getCategoryName(categoryFilter)}
                    </span>
                    <HiChevronDown className={`w-2.5 sm:w-3 h-2.5 sm:h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
                      <button
                        onClick={() => { setCategoryFilter(null); setShowCategoryDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 ${!categoryFilter ? 'text-primary-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}
                      >
                        All Categories
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => { setCategoryFilter(cat.id); setShowCategoryDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 ${categoryFilter === cat.id ? 'text-primary-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hashtag Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      if (!showHashtagDropdown) fetchCategoriesAndHashtags();
                      setShowHashtagDropdown(!showHashtagDropdown);
                      setShowCategoryDropdown(false);
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg border transition-colors ${hashtagFilter
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                  >
                    <span>#</span>
                    <span className="hidden xs:inline max-w-[50px] sm:max-w-none truncate">
                      {hashtagFilter || 'Tag'}
                    </span>
                    <HiChevronDown className={`w-2.5 sm:w-3 h-2.5 sm:h-3 transition-transform ${showHashtagDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showHashtagDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => { setHashtagFilter(null); setShowHashtagDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 ${!hashtagFilter ? 'text-primary-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}
                      >
                        All Hashtags
                      </button>
                      {allHashtags.map(h => (
                        <button
                          key={h.id}
                          onClick={() => { setHashtagFilter(h.name); setShowHashtagDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 ${hashtagFilter === h.name ? 'text-primary-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}
                        >
                          #{h.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] xl:grid-cols-[260px,1fr,280px] gap-4 sm:gap-6">

          {/* Left Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-36 space-y-4">

              {/* Trending Topics */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <HiFire className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Trending</h3>
                </div>
                <div className="space-y-3">
                  {trendingTopics.length === 0 ? (
                    <p className="text-sm text-neutral-500">No trending hashtags yet</p>
                  ) : (
                    trendingTopics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => handleHashtagClick(topic.name)}
                        className={`w-full text-left group p-2 rounded-lg transition-all ${hashtagFilter === topic.name
                          ? 'bg-primary-100 dark:bg-primary-900/30'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                      >
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:underline">#{topic.name}</p>
                        <p className="text-xs text-neutral-500">
                          {topic.postCount >= 1000
                            ? `${(topic.postCount / 1000).toFixed(1)}k posts`
                            : `${topic.postCount} posts`
                          }
                        </p>
                      </button>
                    ))
                  )}
                  {hashtagFilter && (
                    <button
                      onClick={() => setHashtagFilter(null)}
                      className="w-full text-center text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>

            </div>
          </aside>

          {/* Main Feed */}
          <main className="min-w-0">
            {/* New Posts Notification */}
            {hasNewPosts && (
              <button
                onClick={() => { setPage(1); fetchPosts(1, false); }}
                className="w-full mb-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <HiRefresh className="w-4 h-4" />
                New posts available - Click to refresh
              </button>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-4 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => fetchPosts(1, false)} className="text-sm underline">Try again</button>
              </div>
            )}

            {/* Loading State */}
            {loading && posts.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2" />
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-20" />
                      </div>
                    </div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2" />
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
                  </div>
                ))}
              </div>
            )}

            {/* My Posts Tab - Quick input */}
            {activeTab === 'myposts' && !loading && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top duration-500 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUserAvatar}
                    alt="You"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = buildDefaultAvatarUrl({ id: currentUser?.id, fullName: currentUser?.name });
                    }}
                  />
                  <button
                    onClick={handleCreatePost}
                    className="flex-1 text-left px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
                  >
                    Share something with your network...
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <HiPencil className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Posts List */}
            {!loading && posts.length > 0 && (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    id={`post-${post.id}`}
                    className={`animate-in fade-in slide-in-from-bottom duration-500 ${highlightedPostId === post.id
                        ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-950 rounded-2xl'
                        : ''
                      }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PostCard post={mapPostData(post)} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && posts.length === 0 && !error && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'following' ? (
                    <HiUsers className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <HiPencil className="w-8 h-8 text-neutral-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  {activeTab === 'following'
                    ? 'Follow mentors and peers to see their posts here.'
                    : activeTab === 'myposts'
                      ? 'Share your first post with the community!'
                      : 'Be the first to share something!'
                  }
                </p>
                {activeTab === 'following' ? (
                  <Link
                    to="/student/find-mentor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    Find Mentors
                  </Link>
                ) : (
                  <button
                    onClick={handleCreatePost}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <HiPlus className="w-5 h-5" />
                    Create Your First Post
                  </button>
                )}
              </div>
            )}

            {/* Load More */}
            {!loading && hasMore && posts.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  Load more posts
                </button>
              </div>
            )}

            {/* Loading more indicator */}
            {loading && posts.length > 0 && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-neutral-500">
                  <HiRefresh className="w-5 h-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar - For Ads */}
          <aside className="hidden xl:block">
            <div className="sticky top-36 space-y-4">
              {/* Ad Placeholder 1 */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-700 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">AD</span>
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Advertisement Space</p>
                  </div>
                </div>
              </div>

              {/* Ad Placeholder 2 */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="aspect-[3/2] bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-primary-200 dark:bg-primary-800/50 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">AD</span>
                    </div>
                    <p className="text-xs text-primary-400 dark:text-primary-500">Sponsored Content</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile FAB - Create Post */}
      <button
        onClick={handleCreatePost}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-600/30 flex items-center justify-center hover:bg-primary-700 hover:scale-110 active:scale-100 transition-all z-40"
      >
        <HiPlus className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPost}
      />
    </div>
  );
};

export default Community;