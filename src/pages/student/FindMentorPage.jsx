// src/pages/student/FindMentorPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  HiSearch, HiFilter, HiX, HiStar, HiClock, HiChevronRight, HiChatAlt2,
  HiChevronLeft, HiChevronDown, HiLocationMarker, HiCheckCircle
} from "react-icons/hi";
import mentorApi from "../../api/mentorApi";
import requestApi from "../../api/requestApi";
import axiosClient from "../../api/axios";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import locationApi from "../../api/locationApi";
import CustomSelect from "../../components/common/CustomSelect";
import BookRequestModal from "../../components/request/BookRequestModal";
import { isConnected, getOnlineUsers, on } from "../../signalr/chatHub";

const FindMentorPage = () => {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);
  const [filterValues, setFilterValues] = useState({
    priceRange: "",
    rating: "",
    city: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [hashtagDropdownOpen, setHashtagDropdownOpen] = useState(false);

  // Sort & Pagination State
  const [sortBy, setSortBy] = useState("RatingAvg");
  const [sortDescending, setSortDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Data State
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Categories & Hashtags from API
  const [categories, setCategories] = useState([]);
  const [allHashtags, setAllHashtags] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Cities from API (Vietnam provinces)
  const [cities, setCities] = useState([]);

  // Book Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch Categories and Hashtags on mount
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        setLoadingFilters(true);
        const [catRes, hashRes, citiesData] = await Promise.all([
          axiosClient.get("/api/Category"),
          axiosClient.get("/api/Admin/hashtags?pageSize=100"),
          locationApi.getVietnamProvinces(),
        ]);
        
        const categories = catRes?.data?.data || [];
        const hashtags = hashRes?.data?.data?.items || [];
        
        // Fetch category-hashtag mappings using public endpoint
        try {
          const categoryHashtagPromises = categories.map(cat => 
            axiosClient.get(`/api/Category/${cat.id}/hashtags`)
              .then(res => ({ categoryId: cat.id, hashtags: res?.data?.data?.hashtags || [] }))
              .catch(() => null)
          );
          
          const categoryHashtagMappings = (await Promise.all(categoryHashtagPromises)).filter(Boolean);
          
          if (categoryHashtagMappings.length > 0) {
            // Create a map of hashtagId -> categoryIds
            const hashtagToCategoriesMap = {};
            categoryHashtagMappings.forEach(mapping => {
              mapping.hashtags.forEach(h => {
                if (!hashtagToCategoriesMap[h.id]) {
                  hashtagToCategoriesMap[h.id] = [];
                }
                hashtagToCategoriesMap[h.id].push(mapping.categoryId);
              });
            });
            
            // Add categoryIds to each hashtag
            const hashtagsWithCategories = hashtags.map(h => ({
              ...h,
              categoryIds: hashtagToCategoriesMap[h.id] || []
            }));
            
            setAllHashtags(hashtagsWithCategories);
          } else {
            // Fallback: show all hashtags without category filtering
            setAllHashtags(hashtags);
          }
        } catch (err) {
          console.log("Cannot fetch category-hashtag mappings, showing all hashtags:", err);
          setAllHashtags(hashtags);
        }
        
        setCategories(categories);
        setCities(citiesData || []);
      } catch (err) {
        console.log("Failed to fetch filter data:", err);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFiltersData();
  }, []);

  // Filter hashtags by selected category
  const filteredHashtags = useMemo(() => {
    if (!selectedCategoryId) return allHashtags;
    // Only filter if hashtags have categoryIds (i.e., mapping was successful)
    const hasCategories = allHashtags.some(h => h.categoryIds && h.categoryIds.length > 0);
    if (!hasCategories) return allHashtags;
    
    return allHashtags.filter(
      (h) =>
        h.categoryId === Number(selectedCategoryId) ||
        (Array.isArray(h.categoryIds) && h.categoryIds.includes(Number(selectedCategoryId)))
    );
  }, [selectedCategoryId, allHashtags]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (name, value) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategoryId(value);
    setSelectedHashtagIds([]);
    setPage(1);
  };

  const toggleHashtag = (hashtagId) => {
    setSelectedHashtagIds((prev) =>
      prev.includes(hashtagId)
        ? prev.filter((id) => id !== hashtagId)
        : [...prev, hashtagId]
    );
    setPage(1);
  };

  const isPendingStatus = (status) => {
    if (typeof status === 'number') return status === 0;
    const normalized = String(status || '').toLowerCase();
    return normalized === 'open' || normalized === 'pending' || normalized === 'processing';
  };

  const handleBookClick = async (mentor) => {
    // Check if already has pending request for this mentor
    try {
      let page = 1;
      let totalPages = 1;
      let hasPending = false;

      do {
        const res = await requestApi.getMyRequests(page, 50);
        const data = res?.data?.data;
        const items = data?.items || [];
        totalPages = data?.totalPages || 1;

        hasPending = items.some(
          (req) => req?.mentorId === mentor.id && isPendingStatus(req?.status)
        );
        if (hasPending) break;
        page += 1;
      } while (page <= totalPages && page <= 5);

      if (hasPending) {
        setSuccessMessage("");
        alert("You already have a pending request with this mentor. Please wait for accept/reject.");
        return;
      }

      setSelectedMentor(mentor);
      setShowBookModal(true);
    } catch (err) {
      console.log('Check pending request failed:', err);
      setSelectedMentor(mentor);
      setShowBookModal(true);
    }
  };

  const handleBookSuccess = () => {
    setSuccessMessage("Request sent successfully! The mentor will respond soon.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleResetFilters = () => {
    setFilterValues({ priceRange: "", rating: "", city: "" });
    setSearchValue("");
    setSelectedCategoryId("");
    setSelectedHashtagIds([]);
    setSortBy("RatingAvg");
    setSortDescending(true);
    setPage(1);
  };

  // Handle rating filter changes
  useEffect(() => {
    if (filterValues.rating === "asc") {
      setSortBy("RatingAvg");
      setSortDescending(false);
    } else if (filterValues.rating === "desc") {
      setSortBy("RatingAvg");
      setSortDescending(true);
    } else {
      // Default sort when no rating filter
      setSortBy("RatingAvg");
      setSortDescending(true);
    }
  }, [filterValues.rating]);

  // Price range options (in VND)
  const priceRangeOptions = [
    { value: "", label: "Any Price" },
    { value: "0-100000", label: "Under 100K/hr" },
    { value: "100000-300000", label: "100K - 300K/hr" },
    { value: "300000-500000", label: "300K - 500K/hr" },
    { value: "500000+", label: "Over 500K/hr" },
  ];

  // Build query params
  const queryParams = useMemo(() => {
    const params = {
      PageNumber: page,
      PageSize: pageSize,
      SortBy: sortBy,
      SortDescending: sortDescending,
    };

    if (searchValue.trim()) params.Keyword = searchValue.trim();
    if (selectedCategoryId) params.CategoryId = Number(selectedCategoryId);
    if (selectedHashtagIds.length > 0) params.HashtagIds = selectedHashtagIds;

    // Price range
    if (filterValues.priceRange) {
      if (filterValues.priceRange === "0-100000") {
        params.MaxHourlyRate = 100000;
      } else if (filterValues.priceRange === "100000-300000") {
        params.MinHourlyRate = 100000;
        params.MaxHourlyRate = 300000;
      } else if (filterValues.priceRange === "300000-500000") {
        params.MinHourlyRate = 300000;
        params.MaxHourlyRate = 500000;
      } else if (filterValues.priceRange === "500000+") {
        params.MinHourlyRate = 500000;
      }
    }

    // rating filter is sort direction ("asc"/"desc"), not a numeric value — don't send as MinRating
    if (filterValues.city.trim()) params.City = filterValues.city.trim();

    return params;
  }, [searchValue, selectedCategoryId, selectedHashtagIds, filterValues, sortBy, sortDescending, page, pageSize]);

  const hasActiveFilters = searchValue || selectedCategoryId || selectedHashtagIds.length > 0 || 
    filterValues.priceRange || filterValues.rating || filterValues.city;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // Fetch mentors
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setApiError("");

    const t = setTimeout(async () => {
      try {
        const res = await mentorApi.search(queryParams);
        const data = res?.data?.data;
        const items = data?.items ?? [];
        
        if (!alive) return;

        // Update pagination info
        setTotalPages(data?.totalPages ?? 1);
        setTotalCount(data?.totalCount ?? 0);

        // Normalize for UI
        const normalized = items.map((m) => ({
          id: m.id,
          name: m.fullName ?? "Unknown Mentor",
          title: m.title ?? "",
          price: m.hourlyRate ?? 0,
          rating: m.ratingAvg ?? 0,
          reviews: m.ratingCount ?? 0,
          experience: m.experienceYears != null ? `${m.experienceYears}+ years` : "—",
          sessions: m.ratingCount ?? 0,
          skills: (m.hashtags?.length ? m.hashtags : m.categories) ?? [],
          city: m.city ?? "",
          avatar:
            normalizeAvatarUrl(m.avatarUrl) ||
            buildDefaultAvatarUrl({
              id: m.id,
              email: m.email,
              fullName: m.fullName
            }),
          userId: m.userId ?? m.id,
          isOnline: false,
        }));

        setMentors(normalized);

        // Query online status for loaded mentors
        if (isConnected()) {
          const userIds = normalized.map((m) => Number(m.userId)).filter(Boolean);
          if (userIds.length) {
            try { getOnlineUsers(userIds); } catch {}
          }
        }
      } catch (err) {
        if (!alive) return;
        setApiError(err?.response?.data?.message || "Failed to load mentors");
        setMentors([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [queryParams]);

  // ===== Listen for online/offline status changes from SignalR =====
  useEffect(() => {
    const cleanups = [];

    cleanups.push(on("OnlineUsers", (onlineIds) => {
      const set = new Set((onlineIds || []).map(Number));
      setMentors((prev) =>
        prev.map((m) => ({ ...m, isOnline: set.has(Number(m.userId)) }))
      );
    }));

    cleanups.push(on("UserOnline", (userId) => {
      setMentors((prev) =>
        prev.map((m) =>
          Number(m.userId) === Number(userId) ? { ...m, isOnline: true } : m
        )
      );
    }));

    cleanups.push(on("UserOffline", (userId) => {
      setMentors((prev) =>
        prev.map((m) =>
          Number(m.userId) === Number(userId) ? { ...m, isOnline: false } : m
        )
      );
    }));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white shadow-lg animate-in slide-in-from-bottom-4">
          <HiCheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
            Find a Mentor
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">
            Connect with industry experts to accelerate your career
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4">
        {/* Search & Filters Row */}
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <HiFilter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </button>

          {/* Filters (Desktop) */}
          <div className="hidden lg:flex lg:flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <CustomSelect
            value={selectedCategoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={loadingFilters}
            placeholder="All Categories"
            className="min-w-[160px]"
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
            ]}
          />

          {/* Hashtags Multi-select Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHashtagDropdownOpen(!hashtagDropdownOpen)}
              className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-sm font-medium flex items-center gap-2 min-w-[140px]"
            >
              <span>
                {selectedHashtagIds.length === 0
                  ? "Skills"
                  : `${selectedHashtagIds.length} selected`}
              </span>
              <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${hashtagDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {hashtagDropdownOpen && (
              <div className="absolute z-20 w-64 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredHashtags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedHashtagIds.includes(tag.id)}
                      onChange={() => toggleHashtag(tag.id)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                      #{tag.name}
                    </span>
                  </label>
                ))}
                {filteredHashtags.length === 0 && (
                  <div className="px-4 py-3 text-sm text-neutral-500">No skills available</div>
                )}
              </div>
            )}
          </div>

          {/* City Dropdown */}
          <CustomSelect
            value={filterValues.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            placeholder="All Cities"
            className="min-w-[160px]"
            options={[
              { value: "", label: "All Cities" },
              ...cities.map((c) => ({ value: c.name, label: c.name }))
            ]}
          />

          {/* Price Range */}
          <CustomSelect
            value={filterValues.priceRange}
            onChange={(e) => handleFilterChange("priceRange", e.target.value)}
            placeholder="Any Price"
            className="min-w-[150px]"
            options={priceRangeOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
          />

          {/* Rating Filter */}
          <CustomSelect
            value={filterValues.rating}
            onChange={(e) => handleFilterChange("rating", e.target.value)}
            placeholder="Rating: Any"
            className="min-w-[170px]"
            options={[
              { value: "", label: "Rating: Any" },
              { value: "asc", label: "Rating: Low to High" },
              { value: "desc", label: "Rating: High to Low" }
            ]}
          />

          {/* Clear Filters Button */}
          {hasActiveFilters && (
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
          <div className="lg:hidden mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5 sm:space-y-3">
            {/* Category */}
            <CustomSelect
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              placeholder="All Categories"
              className="w-full"
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
              ]}
            />

            {/* Skills/Hashtags (Mobile) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setHashtagDropdownOpen(!hashtagDropdownOpen)}
                className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 font-medium flex items-center justify-between"
              >
                <span>
                  {selectedHashtagIds.length === 0
                    ? "All Skills"
                    : `${selectedHashtagIds.length} skill${selectedHashtagIds.length > 1 ? 's' : ''} selected`}
                </span>
                <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${hashtagDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {hashtagDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredHashtags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedHashtagIds.includes(tag.id)}
                        onChange={() => toggleHashtag(tag.id)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                        #{tag.name}
                      </span>
                    </label>
                  ))}
                  {filteredHashtags.length === 0 && (
                    <div className="px-4 py-3 text-sm text-neutral-500">No skills available</div>
                  )}
                </div>
              )}
            </div>

            {/* City Dropdown (Mobile) */}
            <CustomSelect
              value={filterValues.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              placeholder="All Cities"
              className="w-full"
              options={[
                { value: "", label: "All Cities" },
                ...cities.map((c) => ({ value: c.name, label: c.name }))
              ]}
            />

            {/* Price Range */}
            <CustomSelect
              value={filterValues.priceRange}
              onChange={(e) => handleFilterChange("priceRange", e.target.value)}
              placeholder="Any Price"
              className="w-full"
              options={priceRangeOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
            />

            {/* Rating Filter */}
            <CustomSelect
              value={filterValues.rating}
              onChange={(e) => handleFilterChange("rating", e.target.value)}
              placeholder="Rating: Any"
              className="w-full"
              options={[
                { value: "", label: "Rating: Any" },
                { value: "asc", label: "Rating: Low to High" },
                { value: "desc", label: "Rating: High to Low" }
              ]}
            />

            {/* Selected Hashtags */}
            <div className="flex flex-wrap gap-2">
              {selectedHashtagIds.map((hashId) => {
                const tag = allHashtags.find((h) => h.id === hashId);
                return tag ? (
                  <span
                    key={hashId}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-lg"
                  >
                    #{tag.name}
                    <button onClick={() => toggleHashtag(hashId)} className="hover:text-primary-900">
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>

            {/* Clear/Refresh Button (Mobile) */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              >
                <HiX className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results Info & Pagination Header */}
        {!loading && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span>
              Showing {mentors.length > 0 ? ((page - 1) * pageSize + 1) : 0}-{Math.min(page * pageSize, totalCount)} of {totalCount} mentors
            </span>
            {totalPages > 1 && (
              <span className="text-xs sm:text-sm">Page {page} of {totalPages}</span>
            )}
          </div>
        )}
      </div>

      {/* States */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-3 sm:p-4 text-sm">
          {apiError}
        </div>
      )}

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {loading
          ? Array(8)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 animate-pulse"
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-neutral-200 dark:bg-neutral-800 mb-3 sm:mb-4" />
                <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-3 sm:mb-4" />
                <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            ))
          : mentors.map((mentor, index) => (
            <div
              key={mentor.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="relative">
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-white dark:border-neutral-800 shadow-sm group-hover:scale-105 transition-transform"
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
                    className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-neutral-900 ${mentor.isOnline ? "bg-green-500" : "bg-neutral-400"
                      }`}
                  />
                </div>
                {mentor.reviews > 0 ? (
                  <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <HiStar className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs sm:text-sm font-bold text-yellow-700 dark:text-yellow-400">
                      {Number(mentor.rating).toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500">No reviews</span>
                )}
              </div>

              {/* Info */}
              <div className="mb-3 sm:mb-4">
                <h3
                  onClick={() => window.open(`/student/mentor/${mentor.id}`, '_blank')}
                  className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors cursor-pointer hover:underline line-clamp-1"
                >
                  {mentor.name}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                  {mentor.title}
                </p>
                <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-neutral-400">
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <HiClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {mentor.experience}
                  </span>
                  {mentor.reviews > 0 && <span>{mentor.reviews} reviews</span>}
                </div>
                {mentor.city && (
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-1 text-[10px] sm:text-xs text-neutral-400">
                    <HiLocationMarker className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {mentor.city}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-5">
                {(mentor.skills || []).slice(0, 3).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <span className="text-[10px] sm:text-xs text-neutral-400">From</span>
                  <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                    {formatPrice(mentor.price)}
                    <span className="text-xs sm:text-sm font-normal text-neutral-400"> VND/hr</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Book Button */}
                  <button
                    onClick={() => handleBookClick(mentor)}
                    className="flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 hover:scale-105"
                  >
                    Book
                    <HiChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <HiChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Previous</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    page === pageNum
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden xs:inline">Next</span>
            <HiChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* Book Request Modal */}
      {showBookModal && selectedMentor && (
        <BookRequestModal
          isOpen={showBookModal}
          onClose={() => {
            setShowBookModal(false);
            setSelectedMentor(null);
          }}
          mentor={selectedMentor}
          onSuccess={handleBookSuccess}
        />
      )}
    </div>
  );
};

export default FindMentorPage;
