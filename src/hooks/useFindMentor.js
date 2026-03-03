// src/hooks/useFindMentor.js
import { useEffect, useMemo, useState } from "react";
import mentorApi from "../api/mentorApi";
import requestApi from "../api/requestApi";
import axiosClient from "../api/axios";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../utils/avatar";
import locationApi from "../api/locationApi";
import { isConnected, getOnlineUsers, on } from "../signalr/chatHub";

const PRICE_RANGE_OPTIONS = [
  { value: "", label: "Any Price" },
  { value: "0-100000", label: "Under 100K/hr" },
  { value: "100000-300000", label: "100K - 300K/hr" },
  { value: "300000-500000", label: "300K - 500K/hr" },
  { value: "500000+", label: "Over 500K/hr" },
];

const isPendingStatus = (status) => {
  if (typeof status === "number") return status === 0;
  const normalized = String(status || "").toLowerCase();
  return normalized === "open" || normalized === "pending" || normalized === "processing";
};

export function useFindMentor() {
  // Search & Filter
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);
  const [filterValues, setFilterValues] = useState({ priceRange: "", rating: "", city: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [hashtagDropdownOpen, setHashtagDropdownOpen] = useState(false);

  // Sort & Pagination
  const [sortBy, setSortBy] = useState("RatingAvg");
  const [sortDescending, setSortDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Data
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Filter data
  const [categories, setCategories] = useState([]);
  const [allHashtags, setAllHashtags] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [cities, setCities] = useState([]);

  // Book modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Load filter data on mount
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        setLoadingFilters(true);
        const [catRes, hashRes, citiesData] = await Promise.all([
          axiosClient.get("/api/Category"),
          axiosClient.get("/api/Admin/hashtags?pageSize=100"),
          locationApi.getVietnamProvinces(),
        ]);
        const cats = catRes?.data?.data || [];
        const hashtags = hashRes?.data?.data?.items || [];

        try {
          const mappings = (
            await Promise.all(
              cats.map((cat) =>
                axiosClient
                  .get(`/api/Category/${cat.id}/hashtags`)
                  .then((res) => ({ categoryId: cat.id, hashtags: res?.data?.data?.hashtags || [] }))
                  .catch(() => null)
              )
            )
          ).filter(Boolean);

          if (mappings.length > 0) {
            const hashtagToCategoriesMap = {};
            mappings.forEach(({ categoryId, hashtags: hs }) => {
              hs.forEach((h) => {
                if (!hashtagToCategoriesMap[h.id]) hashtagToCategoriesMap[h.id] = [];
                hashtagToCategoriesMap[h.id].push(categoryId);
              });
            });
            setAllHashtags(hashtags.map((h) => ({ ...h, categoryIds: hashtagToCategoriesMap[h.id] || [] })));
          } else {
            setAllHashtags(hashtags);
          }
        } catch {
          setAllHashtags(hashtags);
        }

        setCategories(cats);
        setCities(citiesData || []);
      } catch {
        // silently fail
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFiltersData();
  }, []);

  // Filter hashtags by selected category
  const filteredHashtags = useMemo(() => {
    if (!selectedCategoryId) return allHashtags;
    const hasCategories = allHashtags.some((h) => h.categoryIds?.length > 0);
    if (!hasCategories) return allHashtags;
    return allHashtags.filter(
      (h) =>
        h.categoryId === Number(selectedCategoryId) ||
        (Array.isArray(h.categoryIds) && h.categoryIds.includes(Number(selectedCategoryId)))
    );
  }, [selectedCategoryId, allHashtags]);

  const handleSearchChange = (e) => { setSearchValue(e.target.value); setPage(1); };
  const handleFilterChange = (name, value) => { setFilterValues((prev) => ({ ...prev, [name]: value })); setPage(1); };
  const handleCategoryChange = (value) => { setSelectedCategoryId(value); setSelectedHashtagIds([]); setPage(1); };
  const toggleHashtag = (hashtagId) => {
    setSelectedHashtagIds((prev) =>
      prev.includes(hashtagId) ? prev.filter((id) => id !== hashtagId) : [...prev, hashtagId]
    );
    setPage(1);
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

  // Sync rating filter → sort params
  useEffect(() => {
    setSortBy("RatingAvg");
    setSortDescending(filterValues.rating !== "asc");
  }, [filterValues.rating]);

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
    if (filterValues.priceRange) {
      const [min, max] = {
        "0-100000": [undefined, 100000],
        "100000-300000": [100000, 300000],
        "300000-500000": [300000, 500000],
        "500000+": [500000, undefined],
      }[filterValues.priceRange] || [];
      if (min != null) params.MinHourlyRate = min;
      if (max != null) params.MaxHourlyRate = max;
    }
    if (filterValues.city.trim()) params.City = filterValues.city.trim();
    return params;
  }, [searchValue, selectedCategoryId, selectedHashtagIds, filterValues, sortBy, sortDescending, page, pageSize]);

  const hasActiveFilters =
    searchValue || selectedCategoryId || selectedHashtagIds.length > 0 ||
    filterValues.priceRange || filterValues.rating || filterValues.city;

  // Fetch mentors (debounced)
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

        setTotalPages(data?.totalPages ?? 1);
        setTotalCount(data?.totalCount ?? 0);

        const normalized = items.map((m) => ({
          id: m.id,
          name: m.fullName ?? "Unknown Mentor",
          title: m.title ?? "",
          price: m.hourlyRate ?? 0,
          rating: m.ratingAvg ?? 0,
          reviews: m.ratingCount ?? 0,
          experience: m.experienceYears != null ? `${m.experienceYears}+ years` : "—",
          skills: (m.hashtags?.length ? m.hashtags : m.categories) ?? [],
          city: m.city ?? "",
          avatar:
            normalizeAvatarUrl(m.avatarUrl) ||
            buildDefaultAvatarUrl({ id: m.id, email: m.email, fullName: m.fullName }),
          userId: m.userId ?? m.id,
          isOnline: false,
        }));
        setMentors(normalized);

        if (isConnected()) {
          const userIds = normalized.map((m) => Number(m.userId)).filter(Boolean);
          if (userIds.length) { try { getOnlineUsers(userIds); } catch {} }
        }
      } catch (err) {
        if (!alive) return;
        setApiError(err?.response?.data?.message || "Failed to load mentors");
        setMentors([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 350);

    return () => { alive = false; clearTimeout(t); };
  }, [queryParams]);

  // Online status via SignalR
  useEffect(() => {
    const cleanups = [
      on("OnlineUsers", (onlineIds) => {
        const set = new Set((onlineIds || []).map(Number));
        setMentors((prev) => prev.map((m) => ({ ...m, isOnline: set.has(Number(m.userId)) })));
      }),
      on("UserOnline", (userId) => {
        setMentors((prev) => prev.map((m) => Number(m.userId) === Number(userId) ? { ...m, isOnline: true } : m));
      }),
      on("UserOffline", (userId) => {
        setMentors((prev) => prev.map((m) => Number(m.userId) === Number(userId) ? { ...m, isOnline: false } : m));
      }),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const handleBookClick = async (mentor) => {
    try {
      let p = 1;
      let tp = 1;
      let hasPending = false;
      do {
        const res = await requestApi.getMyRequests(p, 50);
        const data = res?.data?.data;
        const items = data?.items || [];
        tp = data?.totalPages || 1;
        hasPending = items.some((req) => req?.mentorId === mentor.id && isPendingStatus(req?.status));
        if (hasPending) break;
        p += 1;
      } while (p <= tp && p <= 5);

      if (hasPending) {
        alert("You already have a pending request with this mentor. Please wait for accept/reject.");
        return;
      }
      setSelectedMentor(mentor);
      setShowBookModal(true);
    } catch {
      setSelectedMentor(mentor);
      setShowBookModal(true);
    }
  };

  const handleBookSuccess = () => {
    setSuccessMessage("Request sent successfully! The mentor will respond soon.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price);

  return {
    // search & filter state
    searchValue, selectedCategoryId, selectedHashtagIds, filterValues,
    showFilters, setShowFilters, hashtagDropdownOpen, setHashtagDropdownOpen,
    // filter data
    categories, filteredHashtags, allHashtags, loadingFilters, cities,
    PRICE_RANGE_OPTIONS,
    // handlers
    handleSearchChange, handleFilterChange, handleCategoryChange,
    toggleHashtag, handleResetFilters, hasActiveFilters,
    // pagination
    page, setPage, pageSize, totalPages, totalCount,
    // mentor data
    mentors, loading, apiError,
    // book modal
    showBookModal, setShowBookModal, selectedMentor, setSelectedMentor,
    successMessage, handleBookClick, handleBookSuccess,
    // utils
    formatPrice,
  };
}
