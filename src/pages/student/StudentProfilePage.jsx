import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiMail, HiLocationMarker, HiPhone } from "react-icons/hi";
import { Edit2, Clock, GraduationCap, User, Users } from "lucide-react";
import userProfileApi from "../../api/userProfile";
import communityApi from "../../api/communityApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import mentorApi from "../../api/mentorApi";
import MentorApplicationBanner from "../../components/mentor/MentorApplicationBanner";
import ApplyMentorModal from "../../components/mentor/ApplyMentorModal";
import ConfirmSwitchModal from "../../components/mentor/ConfirmSwitchModal";
import FollowersModal from "../../components/profile/FollowersModal";

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  // Mentor Application State
  const [mentorStatus, setMentorStatus] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Followers/Following State
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followModalData, setFollowModalData] = useState([]);
  const [followModalTitle, setFollowModalTitle] = useState("Followers");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const utc = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return new Date(utc).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const fetchMentorStatus = async () => {
    try {
      const res = await mentorApi.getApplicationStatus();
      if (res.data?.success) {
        setMentorStatus(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch mentor status", err);
    }
  };

  const fetchFollowData = async (userId) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        communityApi.getFollowers(userId),
        communityApi.getFollowing(userId),
      ]);
      
      if (followersRes.data?.success) {
        setFollowersCount(followersRes.data.data.count);
        setFollowers(followersRes.data.data.users.map(u => ({
          id: u.id,
          name: u.fullName,
          avatar: normalizeAvatarUrl(u.avatarUrl) || buildDefaultAvatarUrl({ id: u.id, fullName: u.fullName }),
          role: u.isMentor ? 'mentor' : 'student'
        })));
      }
      
      if (followingRes.data?.success) {
        setFollowingCount(followingRes.data.data.count);
        setFollowing(followingRes.data.data.users.map(u => ({
          id: u.id,
          name: u.fullName,
          avatar: normalizeAvatarUrl(u.avatarUrl) || buildDefaultAvatarUrl({ id: u.id, fullName: u.fullName }),
          role: u.isMentor ? 'mentor' : 'student'
        })));
      }
    } catch (err) {
      console.error("Failed to fetch follow data", err);
    }
  };

  const handleShowFollowers = () => {
    setFollowModalData(followers);
    setFollowModalTitle("Followers");
    setShowFollowersModal(true);
  };

  const handleShowFollowing = () => {
    setFollowModalData(following);
    setFollowModalTitle("Following");
    setShowFollowingModal(true);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userProfileApi.getAll();
        const u = res?.data?.data;
        if (!u) throw new Error("No user profile data");

        // Fetch mentor application status
        fetchMentorStatus();

        // Fetch followers/following data
        if (u.id) {
          fetchFollowData(u.id);
        }

        const mapped = {
          name: u.fullName || "Student",
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
        };

        if (mounted) setProfile(mapped);
      } catch (e) {
        console.log("Fetch profile failed:", e);
        if (mounted) {
          setError(e?.response?.data?.message || "Failed to load profile");
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, []);

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6">
        <div className="text-neutral-500">Loading profile...</div>
      </div>
    );
  }

  const p = profile;

  if (!p) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6">
        <div className="text-red-500">{error || "Cannot load profile"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Main Layout - 3 columns on xl screens */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="xl:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <div className="flex flex-col items-center text-center">
                <img
                  src={p.avatar}
                  alt="avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = buildDefaultAvatarUrl(p.avatarSeed || { email: p.email, fullName: p.name });
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
                />

                <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-4">
                  {p.name}
                </h1>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Student
                </p>

                {/* Followers/Following Stats */}
                <div className="flex justify-center gap-6 mt-4">
                  <button
                    onClick={handleShowFollowers}
                    className="flex flex-col items-center px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">{followersCount}</span>
                    <span className="text-xs text-neutral-500">Followers</span>
                  </button>
                  <button
                    onClick={handleShowFollowing}
                    className="flex flex-col items-center px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">{followingCount}</span>
                    <span className="text-xs text-neutral-500">Following</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate("/student/profile/edit")}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition-colors"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <HiMail className="w-4 h-4 text-neutral-400" />
                  <span className="truncate">{p.email}</span>
                </div>
                {p.phone && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <HiPhone className="w-4 h-4 text-neutral-400" />
                    <span>{p.phone}</span>
                  </div>
                )}
                {p.location && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <HiLocationMarker className="w-4 h-4 text-neutral-400" />
                    <span>{p.location}</span>
                  </div>
                )}
                {p.joinedAt && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span>Joined {formatDate(p.joinedAt)}</span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {(p.school || p.gender) && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-3">
                    Additional Info
                  </h3>
                  <div className="space-y-2">
                    {p.school && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <GraduationCap className="w-4 h-4 text-neutral-400" />
                        <span>{p.school}</span>
                      </div>
                    )}
                    {p.gender && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>{p.gender}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Mentor Application Banner */}
            <MentorApplicationBanner
              statusData={mentorStatus}
              onOpenApply={() => setIsApplyModalOpen(true)}
              onOpenConfirm={() => setIsConfirmModalOpen(true)}
            />

            {/* About */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
                About
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                {p.bio || "No bio yet."}
              </p>
            </div>

            {/* Education & Account Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Education */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
                  Education
                </h2>
                <div className="space-y-4">
                  {p.school && (
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                        School
                      </span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.school}
                      </p>
                    </div>
                  )}
                  {p.major && (
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                        Major
                      </span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.major}
                      </p>
                    </div>
                  )}
                  {!p.school && !p.major && (
                    <p className="text-sm text-neutral-500">No education info yet.</p>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
                  Account Info
                </h2>
                <div className="space-y-4">
                  {p.gender && (
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                        Gender
                      </span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.gender}
                      </p>
                    </div>
                  )}
                  {p.city && (
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                        City
                      </span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.city}
                      </p>
                    </div>
                  )}
                  {p.country && (
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                        Country
                      </span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ApplyMentorModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={fetchMentorStatus}
      />

      <ConfirmSwitchModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onSuccess={fetchMentorStatus}
      />

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followers}
        title="Followers"
      />

      {/* Following Modal */}
      <FollowersModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        followers={following}
        title="Following"
      />
    </div>
  );
};

export default StudentProfilePage;

