// src/pages/common/UserProfilePage.jsx
import { HiMail, HiLocationMarker, HiPhone, HiStar, HiArrowLeft, HiCheckCircle, HiTag } from "react-icons/hi";
import { FolderOpen, Clock, Globe, GraduationCap, BookOpen, Users, UserPlus, UserMinus } from "lucide-react";
import { buildDefaultAvatarUrl } from "../../utils/avatar";
import BookRequestModal from "../../components/request/BookRequestModal";
import FollowersModal from "../../components/profile/FollowersModal";
import ReviewSummary from "../../components/review/ReviewSummary";
import ReviewCard from "../../components/review/ReviewCard";
import PostCard from "../../components/community/PostCard";
import { useUserProfile } from "../../hooks/useUserProfile";

export default function UserProfilePage() {
  const {
    loading, error, profile: p,
    showBookModal, setShowBookModal, successMessage,
    isFollowing, followLoading, followers, following,
    followersCount, followingCount,
    showFollowersModal, setShowFollowersModal,
    showFollowingModal, setShowFollowingModal,
    reviews, reviewSummary, reviewsLoading, reviewsRef,
    userPosts, postsLoading, postsPage, hasMorePosts, fetchUserPosts,
    handleFollow, handleBook, handleBookSuccess, handleViewReviews, handleBack,
    isOwnProfile, isCurrentUserStudent, currentUser,
    formatDate, formatCurrency,
  } = useUserProfile();

  if (loading && !p) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
            <HiArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <div className="text-red-500">{error || "Cannot load profile"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back */}
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
          <HiArrowLeft className="w-4 h-4" /> Go Back
        </button>

        {error && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left – Profile Card */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <div className="flex flex-col items-center text-center">
                <img
                  src={p.avatar}
                  alt="avatar"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = buildDefaultAvatarUrl(p.avatarSeed || { email: p.email, fullName: p.name }); }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
                />
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-4">{p.name}</h1>
                <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${p.isMentor ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                  {p.isMentor ? "Mentor" : "Student"}
                </span>
                {p.isMentor && p.title && <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">{p.title}</p>}

                {p.isMentor && reviewSummary && reviewSummary.totalReviews > 0 && (
                  <button onClick={handleViewReviews} className="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity">
                    <HiStar className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{reviewSummary.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-neutral-500">({reviewSummary.totalReviews} reviews)</span>
                  </button>
                )}

                <div className="flex justify-center gap-6 mt-4">
                  <button onClick={() => setShowFollowersModal(true)} className="flex flex-col items-center px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">{followersCount}</span>
                    <span className="text-xs text-neutral-500">Followers</span>
                  </button>
                  <button onClick={() => setShowFollowingModal(true)} className="flex flex-col items-center px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">{followingCount}</span>
                    <span className="text-xs text-neutral-500">Following</span>
                  </button>
                </div>

                {!isOwnProfile && currentUser && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow transition-colors ${isFollowing ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                  >
                    {followLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> : isFollowing ? <><UserMinus size={16} /> Unfollow</> : <><UserPlus size={16} /> Follow</>}
                  </button>
                )}

                {p.isMentor && isCurrentUserStudent && !isOwnProfile && (
                  <button onClick={handleBook} className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition-colors">
                    Book
                  </button>
                )}
              </div>

              {/* Contact */}
              <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"><HiMail className="w-4 h-4 text-neutral-400" /><span className="truncate">{p.email}</span></div>
                {p.phone && <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"><HiPhone className="w-4 h-4 text-neutral-400" /><span>{p.phone}</span></div>}
                {p.location && <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"><HiLocationMarker className="w-4 h-4 text-neutral-400" /><span>{p.location}</span></div>}
                {p.joinedAt && <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"><Clock className="w-4 h-4 text-neutral-400" /><span>Joined {formatDate(p.joinedAt)}</span></div>}
              </div>

              {/* Additional Info */}
              {(p.school || p.major || p.gender || (p.isMentor && p.experienceYears > 0)) && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-3">Additional Info</h3>
                  <div className="space-y-2">
                    {p.school && <div className="flex items-center justify-between text-sm"><span className="text-neutral-500 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> School</span><span className="text-neutral-900 dark:text-white font-medium">{p.school}</span></div>}
                    {p.major && <div className="flex items-center justify-between text-sm"><span className="text-neutral-500 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Major</span><span className="text-neutral-900 dark:text-white font-medium">{p.major}</span></div>}
                    {p.gender && <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">Gender</span><span className="text-neutral-900 dark:text-white font-medium">{p.gender}</span></div>}
                    {p.isMentor && p.experienceYears > 0 && <div className="flex items-center justify-between text-sm"><span className="text-neutral-500">Experience</span><span className="text-neutral-900 dark:text-white font-medium">{p.experienceYears} {p.experienceYears === 1 ? "year" : "years"}</span></div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right – Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">About</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{p.bio || "No bio yet."}</p>
            </div>

            {/* Reviews */}
            {p.isMentor && (
              <div ref={reviewsRef} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
                  <HiStar className="w-4 h-4 text-yellow-500" /> Reviews
                </h2>
                {reviewsLoading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                ) : (
                  <>
                    {reviewSummary && <div className="mb-4"><ReviewSummary averageRating={reviewSummary.averageRating} totalReviews={reviewSummary.totalReviews} distribution={reviewSummary.distribution} /></div>}
                    {reviews.length > 0 ? (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{reviews.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6">No reviews yet.</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Mentor extras */}
            {p.isMentor && (
              <>
                {/* Pricing */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Pricing</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Hourly Rate</span>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white mt-1">{formatCurrency(p.hourlyRate)}</p>
                    </div>
                    {p.packagePrice > 0 && (
                      <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Package Price</span>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white mt-1">{formatCurrency(p.packagePrice)}</p>
                      </div>
                    )}
                  </div>
                  {p.availabilityNote && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Availability</span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{p.availabilityNote}</p>
                    </div>
                  )}
                </div>

                {/* Introduction */}
                {p.introduction && (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Professional Introduction</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{p.introduction}</p>
                  </div>
                )}

                {/* Categories & Skills */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Categories & Skills</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-3"><FolderOpen className="w-3.5 h-3.5" /> Categories</span>
                      {p.categories?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">{p.categories.map((cat, idx) => <span key={cat.id || idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{cat.name || cat}</span>)}</div>
                      ) : <p className="text-sm text-neutral-500 dark:text-neutral-400">No categories selected</p>}
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-3"><HiTag className="w-3.5 h-3.5" /> Skills</span>
                      {p.hashtags?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">{p.hashtags.map((tag, idx) => <span key={tag.id || idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">#{tag.name || tag}</span>)}</div>
                      ) : <p className="text-sm text-neutral-500 dark:text-neutral-400">No skills selected</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Posts */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Posts
                {userPosts.length > 0 && <span className="text-xs text-neutral-400 font-normal">({userPosts.length})</span>}
              </h2>
              {postsLoading && userPosts.length === 0 ? (
                <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => <PostCard key={post.id} post={post} onRefresh={() => fetchUserPosts(1)} hideAuthor />)}
                  {hasMorePosts && (
                    <button onClick={() => fetchUserPosts(postsPage + 1)} disabled={postsLoading} className="w-full py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-50">
                      {postsLoading ? "Loading..." : "Load more"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6">No posts yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white shadow-lg animate-in slide-in-from-bottom-4">
            <HiCheckCircle className="w-5 h-5" /> {successMessage}
          </div>
        )}

        {p.isMentor && <BookRequestModal isOpen={showBookModal} onClose={() => setShowBookModal(false)} mentor={p} onSuccess={handleBookSuccess} />}
        <FollowersModal isOpen={showFollowersModal} onClose={() => setShowFollowersModal(false)} followers={followers} title="Followers" />
        <FollowersModal isOpen={showFollowingModal} onClose={() => setShowFollowingModal(false)} followers={following} title="Following" />
      </div>
    </div>
  );
}
