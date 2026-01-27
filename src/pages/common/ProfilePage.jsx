import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, GraduationCap, Calendar, Award } from "lucide-react";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileSection from "../../components/profile/ProfileSection";
import SkillTag from "../../components/profile/SkillTag";
import FollowersModal from "../../components/profile/FollowersModal";

import userProfileApi from "../../api/userProfile";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleEditProfile = () => navigate("/mentor/profile/edit");

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await userProfileApi.getAll(); // GET /api/User/profile
        const u = res?.data?.data;
        if (!u) throw new Error("No profile data");

        const mapped = {
          role: u.role === 1 ? "mentor" : "student",
          name: u.fullName ?? "Mentor",
          title: u.mentorProfile?.title ?? "Mentor",
          email: u.email ?? "",
          avatarSeed: { id: u.id, email: u.email, fullName: u.fullName },
          avatar:
            normalizeAvatarUrl(u.avatarUrl) ||
            buildDefaultAvatarUrl({
              id: u.id,
              email: u.email,
              fullName: u.fullName
            }),


          stats: {
            students: u.mentorProfile?.ratingCount ?? 0, // tạm, backend chưa có students
            sessionsCompleted: 0,
            rating: u.mentorProfile?.ratingAvg ?? 0,
            followers: 0,
          },

          location: [u.city, u.country].filter(Boolean).join(", "),
          otherInfo: {
            education: [u.school, u.major].filter(Boolean).join(" • ") || "—",
            languages: ["Vietnamese", "English"],
            joinedAt: u.createdAt,
          },

          bio: u.bio ?? u.mentorProfile?.introduction ?? "—",

          careerInfo: {
            company: u.school || "Independent Mentor",
            experience: `${u.mentorProfile?.experienceYears ?? 0} years`,
            pricePerHour: u.mentorProfile?.hourlyRate ?? 0,
            location: [u.city, u.country].filter(Boolean).join(", "),
          },

          skills: [
            ...(u.mentorProfile?.categories ?? []).map((c) => c.name).filter(Boolean),
            ...(u.mentorProfile?.hashtags ?? []).map((h) => `#${h.name}`).filter(Boolean),
          ],

          followersList: [],
        };

        if (mounted) setProfile(mapped);
      } catch (e) {
        console.log("Load profile failed:", e);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6 text-red-600">Failed to load profile</div>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <ProfileHeader
          profile={profile}
          isOwner={true}
          onEditClick={handleEditProfile}
          onFollowersClick={() => setIsFollowersModalOpen(true)}
          rank="gold"
        />

        <ProfileSection title="General Information" icon={GraduationCap}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 py-2">
            <div className="flex-1 flex flex-col items-center text-center px-2">
              <span className="text-xs font-bold uppercase text-neutral-400">Education</span>
              <p className="text-base font-semibold mt-2">{profile.otherInfo.education}</p>
            </div>

            <div className="hidden md:block w-[1px] h-16 bg-blue-200 dark:bg-blue-800" />

            <div className="flex-1 flex flex-col items-center text-center px-2">
              <span className="text-xs font-bold uppercase text-neutral-400">Languages</span>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {profile.otherInfo.languages.map((lang, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white dark:bg-neutral-900 border rounded-full text-sm">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden md:block w-[1px] h-16 bg-blue-200 dark:bg-blue-800" />

            <div className="flex-1 flex flex-col items-center text-center px-2">
              <span className="text-xs font-bold uppercase text-neutral-400">Joined</span>
              <p className="text-lg font-bold mt-2">{formatDate(profile.otherInfo.joinedAt)}</p>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection title="About" icon={User}>
          <p className="text-sm">{profile.bio}</p>
        </ProfileSection>

        <ProfileSection title="Career Information" icon={Briefcase}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase block mb-1">Company</span>
              <p className="text-sm font-semibold">{profile.careerInfo.company}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase block mb-1">Experience</span>
              <p className="text-sm font-semibold">{profile.careerInfo.experience}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase block mb-1">Hourly Rate</span>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(profile.careerInfo.pricePerHour)}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase block mb-1">Location</span>
              <p className="text-sm font-semibold">{profile.careerInfo.location}</p>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection title="Skills & Expertise" icon={Award}>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, i) => (
              <SkillTag key={i} skill={s} />
            ))}
          </div>
        </ProfileSection>
      </div>

      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        followers={profile.followersList}
      />
    </div>
  );
};

export default ProfilePage;
