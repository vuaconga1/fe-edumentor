// src/hooks/useUserProfile.js
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userApi from "../api/userApi";
import requestApi from "../api/requestApi";
import communityApi from "../api/communityApi";
import reviewApi from "../api/reviewApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../utils/avatar";
import { useAuth } from "./useAuth";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const utc = dateString.endsWith("Z") ? dateString : dateString + "Z";
  return new Date(utc).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatCurrency = (amount) => {
  if (!amount) return "Not set";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const isPendingStatus = (status) => {
  if (typeof status === "number") return status === 0;
  const normalized = String(status || "").toLowerCase();
  return normalized === "open" || normalized === "pending" || normalized === "processing";
};

const mapPostData = (post) => ({
  id: post.id,
  author: {
    id: post.authorId,
    name: post.authorName || "Unknown",
    avatar: post.authorAvatar || buildDefaultAvatarUrl({ id: post.authorId, fullName: post.authorName }),
    avatarUrl: post.authorAvatar,
    role: post.authorRole || "Student",
  },
  title: post.title,
  content: post.contentPreview || post.content,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  isFollowing: post.isFollowing || false,
  files: post.files || [],
  categoryId: post.categoryId,
  categoryName: post.categoryName,
  stats: { likes: post.likeCount || 0, comments: post.commentCount || 0, shares: 0, views: 0 },
  tags: post.hashtags || [],
  proposalCount: post.proposalCount || 0,
  hasProposals: (post.proposalCount || 0) > 0,
});

export function useUserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsFetched, setReviewsFetched] = useState(false);
  const reviewsRef = useRef(null);

  // Posts
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);

  // Load profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await userApi.getById(id);
        const u = res?.data?.data;
        if (!u) throw new Error("No user data");
        const isMentor = u.role === 1 || u.role === "Mentor";
        const mp = u.mentorProfile || {};
        const mapped = {
          id: u.id,
          name: u.fullName || "User",
          email: u.email || "",
          phone: u.phone || "",
          gender: u.gender || "",
          school: u.school || "",
          major: u.major || "",
          bio: u.bio || "",
          city: u.city || "",
          country: u.country || "",
          location: [u.city, u.country].filter(Boolean).join(", "),
          avatarSeed: { id: u.id, email: u.email, fullName: u.fullName },
          avatar:
            normalizeAvatarUrl(u.avatarUrl) ||
            buildDefaultAvatarUrl({ id: u.id, email: u.email, fullName: u.fullName }),
          joinedAt: u.createdAt,
          isMentor,
          role: isMentor ? "Mentor" : "Student",
          title: mp.title || "",
          hourlyRate: mp.hourlyRate || 0,
          packagePrice: mp.packagePrice || 0,
          experienceYears: mp.experienceYears || 0,
          introduction: mp.introduction || "",
          availabilityNote: mp.availabilityNote || "",
          ratingAvg: mp.ratingAvg || 0,
          ratingCount: mp.ratingCount || 0,
          categories: mp.categories || [],
          hashtags: mp.hashtags || [],
        };
        if (mounted) setProfile(mapped);
      } catch (e) {
        if (mounted) { setError(e?.response?.data?.message || "Failed to load profile"); setProfile(null); }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // Follow data
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [frsRes, fngRes] = await Promise.all([
          communityApi.getFollowers(id),
          communityApi.getFollowing(id),
        ]);
        if (frsRes.data?.success) {
          setFollowersCount(frsRes.data.data.count);
          setFollowers(frsRes.data.data.users.map((u) => ({
            id: u.id, name: u.fullName,
            avatar: normalizeAvatarUrl(u.avatarUrl) || buildDefaultAvatarUrl({ id: u.id, fullName: u.fullName }),
            role: u.isMentor ? "mentor" : "student",
          })));
        }
        if (fngRes.data?.success) {
          setFollowingCount(fngRes.data.data.count);
          setFollowing(fngRes.data.data.users.map((u) => ({
            id: u.id, name: u.fullName,
            avatar: normalizeAvatarUrl(u.avatarUrl) || buildDefaultAvatarUrl({ id: u.id, fullName: u.fullName }),
            role: u.isMentor ? "mentor" : "student",
          })));
        }
      } catch {}
    })();
  }, [id]);

  // Check following status
  useEffect(() => {
    if (!id || !currentUser || String(currentUser.id) === String(id)) return;
    (async () => {
      try {
        const res = await communityApi.isFollowing(id);
        if (res.data?.success) setIsFollowing(!!res.data.data);
      } catch {}
    })();
  }, [id, currentUser]);

  // Fetch posts
  const fetchUserPosts = async (page = 1) => {
    if (!id) return;
    try {
      setPostsLoading(true);
      const res = await communityApi.getUserPosts(id, { pageNumber: page, pageSize: 6 });
      const data = res?.data?.data;
      if (data) {
        const mapped = (data.items || []).map(mapPostData);
        setUserPosts((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
        setHasMorePosts(page < (data.totalPages || 1));
        setPostsPage(page);
      }
    } catch {}
    finally { setPostsLoading(false); }
  };

  useEffect(() => { fetchUserPosts(1); }, [id]);

  // Auto-fetch reviews for mentors
  useEffect(() => {
    if (!profile?.id || !profile?.isMentor || reviewsFetched) return;
    (async () => {
      try {
        setReviewsLoading(true);
        setReviewsFetched(true);
        const [summaryRes, reviewsRes] = await Promise.all([
          reviewApi.getMentorReviewSummary(profile.id),
          reviewApi.getMentorReviews(profile.id, { pageNumber: 1, pageSize: 50 }),
        ]);
        const s = summaryRes?.data?.data;
        if (s) setReviewSummary({ averageRating: s.averageRating || 0, totalReviews: s.totalReviews || 0, distribution: { 5: s.fiveStarCount || 0, 4: s.fourStarCount || 0, 3: s.threeStarCount || 0, 2: s.twoStarCount || 0, 1: s.oneStarCount || 0 } });
        const items = reviewsRes?.data?.data?.items || [];
        setReviews(items.map((r) => ({
          id: r.id, studentId: r.studentId,
          studentName: r.studentName || "Anonymous",
          studentAvatar: normalizeAvatarUrl(r.studentAvatar) || buildDefaultAvatarUrl({ fullName: r.studentName }),
          courseName: r.orderTitle || "Mentoring Session",
          rating: r.rating, date: r.createdAt, comment: r.comment || "", tags: [],
        })));
      } catch {}
      finally { setReviewsLoading(false); }
    })();
  }, [profile?.id, profile?.isMentor]);

  const handleFollow = async () => {
    if (!id || followLoading) return;
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await communityApi.unfollowUser(id);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        setFollowers((prev) => prev.filter((f) => f.id !== currentUser?.id));
      } else {
        await communityApi.followUser(id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "";
      if (msg.includes("already following")) setIsFollowing(true);
      else if (msg.includes("not following")) setIsFollowing(false);
    } finally { setFollowLoading(false); }
  };

  const handleBook = async () => {
    if (!profile?.id) return;
    try {
      let p = 1, tp = 1, hasPending = false;
      do {
        const res = await requestApi.getMyRequests(p, 50);
        const data = res?.data?.data;
        const items = data?.items || [];
        tp = data?.totalPages || 1;
        hasPending = items.some((req) => req?.mentorId === profile.id && isPendingStatus(req?.status));
        if (hasPending) break;
        p++;
      } while (p <= tp && p <= 5);
      if (hasPending) { alert("You already have a pending request with this mentor."); return; }
      setShowBookModal(true);
    } catch { setShowBookModal(true); }
  };

  const handleBookSuccess = () => {
    setSuccessMessage("Request sent successfully! The mentor will respond soon.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleViewReviews = () => {
    setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else {
      const base = currentUser?.role === "Mentor" || currentUser?.role === 1 ? "/mentor" : "/student";
      navigate(`${base}/community`);
    }
  };

  const isOwnProfile = currentUser?.id === profile?.id;
  const isCurrentUserStudent = currentUser?.role === "Student" || currentUser?.role === 0;

  return {
    loading, error, profile,
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
  };
}
