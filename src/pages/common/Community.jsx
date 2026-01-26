import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import postsData from '../../mock/posts.json';
import {
  HiSparkles,
  HiUsers,
  HiUserCircle,
  HiPlus,
  HiPencil,
  HiTrendingUp,
  HiSearch,
  HiFire,
  HiBookmark,
  HiOutlineSparkles
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
  const [activeTab, setActiveTab] = useState('foryou');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [headerRef, headerVisible] = useScrollAnimation();

  // Current logged-in user ID (in real app, this would come from auth context)
  const currentUserId = 'current_user'; // Changed to ensure My Posts shows only user's own posts

  // Mock data for different tabs
  const myPosts = postsData.filter(post => post.author.id === currentUserId);
  const followingPosts = postsData.filter(post => post.userInteraction?.isFollowing);

  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'following':
        return followingPosts;
      case 'myposts':
        return myPosts;
      default:
        return postsData;
    }
  };

  const handleCreatePost = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSubmitPost = (postData) => {
    console.log('New post created:', postData);
  };

  const tabs = [
    { id: 'foryou', label: 'For You', icon: HiSparkles },
    { id: 'following', label: 'Following', icon: HiUsers },
    { id: 'myposts', label: 'My Posts', icon: HiUserCircle },
  ];

  // Trending topics mock data
  const trendingTopics = [
    { tag: '#ReactJS', posts: '2.4k posts' },
    { tag: '#WebDevelopment', posts: '1.8k posts' },
    { tag: '#CareerTips', posts: '956 posts' },
    { tag: '#UIDesign', posts: '734 posts' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div
        ref={headerRef}
        className={`sticky top-4 z-30 mx-4 mb-6 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <div className="px-4 lg:px-6">
          {/* Title row */}
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Community</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">Connect, share and grow together</p>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  className="w-64 pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-full text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] xl:grid-cols-[280px,1fr,300px] gap-6">

          {/* Left Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-36 space-y-4">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleCreatePost}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl transition-all"
                  >
                    <HiPencil className="w-5 h-5" />
                    Write a post
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all">
                    <HiBookmark className="w-5 h-5" />
                    Saved posts
                  </button>
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <HiFire className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Trending</h3>
                </div>
                <div className="space-y-3">
                  {trendingTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left group"
                    >
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:underline">{topic.tag}</p>
                      <p className="text-xs text-neutral-500">{topic.posts}</p>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </aside>

          {/* Main Feed */}
          <main className="min-w-0">
            {/* For You Tab - Just posts, no input */}
            {activeTab === 'foryou' && (
              <div className="space-y-4">
                {getFilteredPosts().map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-in fade-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}

            {/* Following Tab - Quick input + Posts */}
            {activeTab === 'following' && (
              <div className="space-y-4">

                {/* Following Posts or Empty State */}
                {followingPosts.length === 0 ? (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiUsers className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No posts yet</h3>
                    <p className="text-neutral-500 text-sm mb-4">Follow mentors and peers to see their posts here.</p>
                    <Link
                      to="/student/find-mentor"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      Find Mentors
                    </Link>
                  </div>
                ) : (
                  followingPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="animate-in fade-in slide-in-from-bottom duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <PostCard post={post} />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* My Posts Tab - Quick input + Posts */}
            {activeTab === 'myposts' && (
              <div className="space-y-4">
                {/* Quick post input for My Posts */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top duration-500">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="You"
                      className="w-10 h-10 rounded-full object-cover"
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

                {/* My Posts List or Empty State */}
                {myPosts.length === 0 ? (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiPencil className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No posts yet</h3>
                    <p className="text-neutral-500 text-sm mb-4">Share your first post with the community!</p>
                    <button
                      onClick={handleCreatePost}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <HiPlus className="w-5 h-5" />
                      Create Your First Post
                    </button>
                  </div>
                ) : (
                  myPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="animate-in fade-in slide-in-from-bottom duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <PostCard post={post} />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Load More */}
            {getFilteredPosts().length > 0 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors">
                  Load more posts
                </button>
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