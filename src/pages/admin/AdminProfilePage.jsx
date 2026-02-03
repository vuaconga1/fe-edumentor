import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiMail, HiLocationMarker, HiPhone } from "react-icons/hi";
import { Edit2 } from "lucide-react";
import userProfileApi from "../../api/userProfile";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import { getRoleDisplayName } from "../../utils/userRole";

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

        const mapped = {
          name: u.fullName || "Admin",
          email: u.email || "",
          phone: u.phone || "",
          gender: u.gender || "",
          bio: u.bio || "",
          location: [u.city, u.country].filter(Boolean).join(", "),
          avatarSeed: { id: u.id, email: u.email, fullName: u.fullName },
          avatar:
            normalizeAvatarUrl(u.avatarUrl) ||
            buildDefaultAvatarUrl({ id: u.id, email: u.email, fullName: u.fullName }),
          joinedAt: u.createdAt,
          roleDisplayName: getRoleDisplayName(u.role),
        };

        if (mounted) setProfile(mapped);
      } catch (e) {
        console.log("Fetch admin profile failed:", e);
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="text-neutral-500">Loading profile...</div>
      </div>
    );
  }

  const p = profile;

  if (!p) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="text-red-500">{error || "Cannot load profile"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              <img
                src={p.avatar}
                alt="avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = buildDefaultAvatarUrl(p.avatarSeed || { email: p.email, fullName: p.name });
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow"
              />

              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
                  {p.name}
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium mt-0.5">
                  {p.roleDisplayName}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-1.5">
                    <HiMail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[200px]">{p.email}</span>
                  </span>

                  {p.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <HiPhone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {p.phone}
                    </span>
                  )}

                  {p.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <HiLocationMarker className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {p.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/admin/profile/edit")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors w-full sm:w-auto"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* About */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white mb-3">
              About
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {p.bio || "No bio yet."}
            </p>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white mb-3">
              Account Info
            </h2>

            <div className="space-y-3 sm:space-y-4">
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

              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                  Joined
                </span>
                <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                  {formatDate(p.joinedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
