// src/pages/student/FindMentorPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiSearch, HiFilter, HiX, HiStar, HiClock, HiChevronRight, HiChatAlt2 } from "react-icons/hi";
import mentorApi from "../../api/mentorApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";



const FindMentorPage = () => {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [filterValues, setFilterValues] = useState({
    expertise: "",
    priceRange: "",
    rating: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const handleSearchChange = (e) => setSearchValue(e.target.value);

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value })); // FIX BUG
  };

  const handleResetFilters = () => {
    setFilterValues({ expertise: "", priceRange: "", rating: "" });
    setSearchValue("");
  };

  const filtersConfig = [
    {
      label: "Expertise",
      name: "expertise",
      options: [
        { value: "react", label: "React" },
        { value: "nodejs", label: "Node.js" },
        { value: "java", label: "Java" },
        { value: "devops", label: "DevOps" },
        { value: "uiux", label: "UI/UX Design" },
      ],
    },
    {
      label: "Price Range",
      name: "priceRange",
      options: [
        { value: "0-50", label: "Under $50/hr" },
        { value: "50-100", label: "$50 - $100/hr" },
        { value: "100+", label: "Over $100/hr" },
      ],
    },
    {
      label: "Rating",
      name: "rating",
      options: [
        { value: "5", label: "5 Stars" },
        { value: "4", label: "4+ Stars" },
        { value: "3", label: "3+ Stars" },
      ],
    },
  ];

  // map filters -> query params của /api/Mentor/search
  const queryParams = useMemo(() => {
    const params = {
      PageNumber: 1,
      PageSize: 12,
      SortBy: "RatingAvg",
      SortDescending: true,
    };

    // keyword = searchValue + expertise (vì backend có Keyword; HashtagIds cần id số)
    const kw = [searchValue, filterValues.expertise].filter(Boolean).join(" ").trim();
    if (kw) params.Keyword = kw;

    // price range -> MinHourlyRate / MaxHourlyRate
    if (filterValues.priceRange === "0-50") {
      params.MaxHourlyRate = 50;
    } else if (filterValues.priceRange === "50-100") {
      params.MinHourlyRate = 50;
      params.MaxHourlyRate = 100;
    } else if (filterValues.priceRange === "100+") {
      params.MinHourlyRate = 100;
    }

    // rating -> MinRating
    if (filterValues.rating) params.MinRating = Number(filterValues.rating);

    return params;
  }, [searchValue, filterValues]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setApiError("");

    const t = setTimeout(async () => {
      try {
        const res = await mentorApi.search(queryParams);
        // swagger: MentorListDtoPagedResponseApiResponse => data.items :contentReference[oaicite:7]{index=7}
        const items = res?.data?.data?.items ?? [];
        if (!alive) return;

        // normalize UI fields giống mock
        const normalized = items.map((m) => ({
          id: m.id,
          name: m.fullName ?? "Unknown Mentor",
          title: m.title ?? "",
          price: m.hourlyRate ?? 0,
          rating: m.ratingAvg ?? 0,
          reviews: m.ratingCount ?? 0,
          experience: m.experienceYears != null ? `${m.experienceYears}+ years` : "—",
          // sessions không có trong DTO => hiển thị bằng reviews để giữ layout
          sessions: m.ratingCount ?? 0,
          skills: (m.hashtags?.length ? m.hashtags : m.categories) ?? [],
          avatar:
            normalizeAvatarUrl(m.avatarUrl) ||
            buildDefaultAvatarUrl({
              id: m.id,
              email: m.email,          // nếu API có
              fullName: m.fullName
            }),

          isOnline: false, // API không có field này
        }));

        setMentors(normalized);
      } catch (err) {
        if (!alive) return;
        setApiError(err?.response?.data?.message || "Failed to load mentors");
        setMentors([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 350); // debounce nhẹ cho search

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [queryParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
            Find a Mentor
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Connect with industry experts to accelerate your career
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search by name, skill, company."
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <HiFilter className="w-5 h-5" />
            Filters
          </button>

          {/* Filters (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            {filtersConfig.map((filter) => (
              <select
                key={filter.name}
                value={filterValues[filter.name]}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none cursor-pointer"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

            {(filterValues.expertise || filterValues.priceRange || filterValues.rating || searchValue) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
              >
                <HiX className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters (Mobile) */}
        {showFilters && (
          <div className="lg:hidden mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
            {filtersConfig.map((filter) => (
              <select
                key={filter.name}
                value={filterValues[filter.name]}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* States */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">
          {apiError}
        </div>
      )}

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading
          ? Array(8)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 animate-pulse"
              >
                <div className="h-14 w-14 rounded-xl bg-neutral-200 dark:bg-neutral-800 mb-4" />
                <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
                <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            ))
          : mentors.map((mentor, index) => (
            <div
              key={mentor.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white dark:border-neutral-800 shadow-sm group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = buildDefaultAvatarUrl({
                        id: mentor.id,
                        email: mentor.email,
                        fullName: mentor.name
                      });
                    }}
                  />
                  
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 ${mentor.isOnline ? "bg-green-500" : "bg-neutral-400"
                      }`}
                  />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <HiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                    {Number(mentor.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="mb-4">
                <h3
                  onClick={() => navigate(`/student/mentor/${mentor.id}`)}
                  className="font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors cursor-pointer hover:underline"
                >
                  {mentor.name}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                  {mentor.title}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <HiClock className="w-3.5 h-3.5" />
                    {mentor.experience}
                  </span>
                  <span>{mentor.reviews} reviews</span>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {(mentor.skills || []).slice(0, 3).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <span className="text-xs text-neutral-400">From</span>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">
                    ${mentor.price}
                    <span className="text-sm font-normal text-neutral-400">/hr</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Chat Button */}
                  <button
                    onClick={() => navigate(`/student/messaging?mentorId=${mentor.id}`)}
                    className="flex items-center gap-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                    title="Chat with mentor"
                  >
                    <HiChatAlt2 className="w-4 h-4" />
                    Chat
                  </button>

                  {/* Book Button */}
                  <button
                    onClick={() => navigate(`/student/mentor/${mentor.id}`)}
                    className="flex items-center gap-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 hover:scale-105"
                  >
                    Book Now
                    <HiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
      </div>

      {/* Empty State */}
      {!loading && !apiError && mentors.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center">
          <div className="text-lg font-semibold text-neutral-900 dark:text-white">No mentors found</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Try adjusting your search or filters.
          </div>
        </div>
      )}
    </div>
  );
};

export default FindMentorPage;
