import React, { useEffect, useMemo, useState } from "react";
import {
  HiAcademicCap,
  HiCalendar,
  HiClock,
  HiTrendingUp,
  HiUserGroup,
  HiChat,
  HiStar,
  HiArrowRight,
} from "react-icons/hi";
import { Link } from "react-router-dom";
import studentApi from "../../api/studentApi";

const StudentHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [studentName, setStudentName] = useState("Student");

  // overview numbers
  const [overview, setOverview] = useState({
    sessionsCount: 0,
    mentorsCount: 0,
    learningHours: 0,
    avgRating: 0,
  });

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);

  const stats = useMemo(() => {
    return [
      { label: "Sessions", value: overview.sessionsCount, icon: HiAcademicCap, change: "" },
      { label: "Mentors", value: overview.mentorsCount, icon: HiUserGroup, change: "" },
      { label: "Hours", value: overview.learningHours, icon: HiClock, change: "" },
      { label: "Avg Rating", value: overview.avgRating, icon: HiStar, change: overview.avgRating >= 4.5 ? "Excellent" : "" },
    ];
  }, [overview]);

  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      try {
        setLoading(true);
        setError("");

        // Ưu tiên: backend có endpoint dashboard tổng hợp
        const [profileRes] = await Promise.allSettled([
          studentApi.getProfile()
        ]);

        if (profileRes.status === "fulfilled") {
          const p = profileRes.value?.data?.data ?? profileRes.value?.data;
          setStudentName(p?.fullName || p?.name || "Student");
        }

        // giữ overview + sessions + mentors = mock
        setLoading(false);
        return;


        if (!mounted) return;

        // profile
        if (profileRes.status === "fulfilled") {
          const p = profileRes.value?.data?.data ?? profileRes.value?.data;
          setStudentName(p?.fullName || p?.name || "Student");
        }

        // dashboard overview (nếu có)
        if (dashRes.status === "fulfilled") {
          const d = dashRes.value?.data?.data ?? dashRes.value?.data;
          setOverview({
            sessionsCount: d?.sessionsCount ?? d?.totalSessions ?? 0,
            mentorsCount: d?.mentorsCount ?? d?.totalMentors ?? 0,
            learningHours: d?.learningHours ?? d?.totalHours ?? 0,
            avgRating: d?.avgRating ?? d?.ratingAverage ?? 0,
          });
        }

        // upcoming sessions
        if (sessionsRes.status === "fulfilled") {
          const s = sessionsRes.value?.data?.data ?? sessionsRes.value?.data;
          const list = Array.isArray(s?.items) ? s.items : (Array.isArray(s) ? s : []);
          setUpcomingSessions(list);
        }

        // recommended mentors
        if (mentorsRes.status === "fulfilled") {
          const m = mentorsRes.value?.data?.data ?? mentorsRes.value?.data;
          const list = Array.isArray(m?.items) ? m.items : (Array.isArray(m) ? m : []);
          setRecommendedMentors(list);
        }
      } catch (e) {
        console.log("Student dashboard fetch failed", e);
        if (mounted) setError("Student dashboard fetch failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
            👋 Hello, {studentName}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Welcome back! Continue your learning journey.
          </p>

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>

        <Link
          to="/student/find-mentor"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:scale-105"
        >
          Find Mentor
          <HiArrowRight />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-300 group cursor-default"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 group-hover:scale-110 transition-all duration-300">
                <stat.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-lg">
                {loading ? "..." : (stat.change || "")}
              </span>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
              {loading ? "—" : stat.value}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <HiCalendar className="text-primary-600 dark:text-primary-400" />
              Upcoming Sessions
            </h2>
            <Link
              to="/student/orders"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {(loading ? [] : upcomingSessions).map((session, index) => (
              <div
                key={session.id ?? index}
                className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 group cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  src={session.avatar || session.mentorAvatar || "/avatar-default.jpg"}
                  alt={session.mentor || session.mentorName || "Mentor"}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-neutral-700 shadow-sm group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {session.topic || session.subject || "Session"}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    with {session.mentor || session.mentorName || "Mentor"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {session.dateLabel || session.date || "—"}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {session.time || session.timeRange || "—"}
                  </div>
                </div>
              </div>
            ))}

            {!loading && upcomingSessions.length === 0 && (
              <div className="text-sm text-neutral-500">No upcoming sessions.</div>
            )}
          </div>
        </div>

        {/* Recommended Mentors */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <HiTrendingUp className="text-primary-600 dark:text-primary-400" />
              Recommended for you
            </h2>
          </div>

          <div className="space-y-4">
            {(loading ? [] : recommendedMentors).map((mentor) => (
              <div
                key={mentor.id}
                className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={mentor.avatar || mentor.avatarUrl || "/avatar-default.jpg"}
                    alt={mentor.name || mentor.fullName || "Mentor"}
                    className="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {mentor.name || mentor.fullName}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {mentor.title || mentor.headline || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <HiStar className="text-yellow-500" />
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {mentor.rating ?? mentor.avgRating ?? "-"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(mentor.skills || mentor.tags || []).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {!loading && recommendedMentors.length === 0 && (
              <div className="text-sm text-neutral-500">No recommended mentors.</div>
            )}
          </div>

          <Link
            to="/student/find-mentor"
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-xl hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-600 dark:hover:text-primary-400 transition-all duration-300"
          >
            Explore more
            <HiArrowRight />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Need help?</h2>
            <p className="text-primary-100">Our support team is always ready to help you 24/7</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/student/messaging"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 hover:scale-105"
            >
              <HiChat />
              Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
