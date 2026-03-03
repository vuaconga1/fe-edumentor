// src/pages/student/FindMentorPage.jsx
import {
  HiSearch, HiFilter, HiX, HiChevronLeft, HiChevronRight,
  HiChevronDown, HiCheckCircle,
} from "react-icons/hi";
import CustomSelect from "../../components/common/CustomSelect";
import BookRequestModal from "../../components/request/BookRequestModal";
import MentorCard from "../../components/mentor/MentorCard";
import { useFindMentor } from "../../hooks/useFindMentor";

export default function FindMentorPage() {
  const {
    searchValue, selectedCategoryId, selectedHashtagIds, filterValues,
    showFilters, setShowFilters, hashtagDropdownOpen, setHashtagDropdownOpen,
    categories, filteredHashtags, allHashtags, loadingFilters, cities,
    PRICE_RANGE_OPTIONS,
    handleSearchChange, handleFilterChange, handleCategoryChange,
    toggleHashtag, handleResetFilters, hasActiveFilters,
    page, setPage, pageSize, totalPages, totalCount,
    mentors, loading, apiError,
    showBookModal, setShowBookModal, selectedMentor, setSelectedMentor,
    successMessage, handleBookClick, handleBookSuccess,
    formatPrice,
  } = useFindMentor();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white shadow-lg animate-in slide-in-from-bottom-4">
          <HiCheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">Find a Mentor</h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">
            Connect with industry experts to accelerate your career
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
          {/* Search */}
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
            {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
          </button>

          {/* Desktop Filters */}
          <div className="hidden lg:flex lg:flex-wrap items-center gap-3">
            <CustomSelect
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={loadingFilters}
              placeholder="All Categories"
              className="min-w-[160px]"
              options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />

            {/* Hashtag Multi-select */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setHashtagDropdownOpen(!hashtagDropdownOpen)}
                className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-sm font-medium flex items-center gap-2 min-w-[140px]"
              >
                <span>{selectedHashtagIds.length === 0 ? "Skills" : `${selectedHashtagIds.length} selected`}</span>
                <HiChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${hashtagDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {hashtagDropdownOpen && (
                <div className="absolute z-20 w-64 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredHashtags.map((tag) => (
                    <label key={tag.id} className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer">
                      <input type="checkbox" checked={selectedHashtagIds.includes(tag.id)} onChange={() => toggleHashtag(tag.id)} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                      <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">#{tag.name}</span>
                    </label>
                  ))}
                  {filteredHashtags.length === 0 && <div className="px-4 py-3 text-sm text-neutral-500">No skills available</div>}
                </div>
              )}
            </div>

            <CustomSelect
              value={filterValues.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              placeholder="All Cities"
              className="min-w-[160px]"
              options={[{ value: "", label: "All Cities" }, ...cities.map((c) => ({ value: c.name, label: c.name }))]}
            />
            <CustomSelect
              value={filterValues.priceRange}
              onChange={(e) => handleFilterChange("priceRange", e.target.value)}
              placeholder="Any Price"
              className="min-w-[150px]"
              options={PRICE_RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <CustomSelect
              value={filterValues.rating}
              onChange={(e) => handleFilterChange("rating", e.target.value)}
              placeholder="Rating: Any"
              className="min-w-[170px]"
              options={[{ value: "", label: "Rating: Any" }, { value: "asc", label: "Rating: Low to High" }, { value: "desc", label: "Rating: High to Low" }]}
            />
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                <HiX className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="lg:hidden mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5 sm:space-y-3">
            <CustomSelect
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              placeholder="All Categories"
              className="w-full"
              options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => setHashtagDropdownOpen(!hashtagDropdownOpen)}
                className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 font-medium flex items-center justify-between"
              >
                <span>{selectedHashtagIds.length === 0 ? "All Skills" : `${selectedHashtagIds.length} skill${selectedHashtagIds.length > 1 ? "s" : ""} selected`}</span>
                <HiChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${hashtagDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {hashtagDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredHashtags.map((tag) => (
                    <label key={tag.id} className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer">
                      <input type="checkbox" checked={selectedHashtagIds.includes(tag.id)} onChange={() => toggleHashtag(tag.id)} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                      <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">#{tag.name}</span>
                    </label>
                  ))}
                  {filteredHashtags.length === 0 && <div className="px-4 py-3 text-sm text-neutral-500">No skills available</div>}
                </div>
              )}
            </div>

            <CustomSelect
              value={filterValues.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              placeholder="All Cities"
              className="w-full"
              options={[{ value: "", label: "All Cities" }, ...cities.map((c) => ({ value: c.name, label: c.name }))]}
            />
            <CustomSelect
              value={filterValues.priceRange}
              onChange={(e) => handleFilterChange("priceRange", e.target.value)}
              placeholder="Any Price"
              className="w-full"
              options={PRICE_RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <CustomSelect
              value={filterValues.rating}
              onChange={(e) => handleFilterChange("rating", e.target.value)}
              placeholder="Rating: Any"
              className="w-full"
              options={[{ value: "", label: "Rating: Any" }, { value: "asc", label: "Rating: Low to High" }, { value: "desc", label: "Rating: High to Low" }]}
            />
            <div className="flex flex-wrap gap-2">
              {selectedHashtagIds.map((hashId) => {
                const tag = allHashtags.find((h) => h.id === hashId);
                return tag ? (
                  <span key={hashId} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-lg">
                    #{tag.name}
                    <button onClick={() => toggleHashtag(hashId)} className="hover:text-primary-900">×</button>
                  </span>
                ) : null;
              })}
            </div>
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
                <HiX className="w-4 h-4" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results Info */}
        {!loading && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span>Showing {mentors.length > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, totalCount)} of {totalCount} mentors</span>
            {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
          </div>
        )}
      </div>

      {/* Error */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-3 sm:p-4 text-sm">
          {apiError}
        </div>
      )}

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {loading
          ? Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 animate-pulse">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-neutral-200 dark:bg-neutral-800 mb-3 sm:mb-4" />
                <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-3 sm:mb-4" />
                <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            ))
          : mentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} onBook={handleBookClick} formatPrice={formatPrice} />
            ))}
      </div>

      {/* Empty State */}
      {!loading && !apiError && mentors.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center">
          <div className="text-lg font-semibold text-neutral-900 dark:text-white">No mentors found</div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Try adjusting your search or filters.</div>
          {hasActiveFilters && (
            <button onClick={handleResetFilters} className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
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

          <div className="flex items-center gap-0.5 sm:gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
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

      {/* Book Modal */}
      {showBookModal && selectedMentor && (
        <BookRequestModal
          isOpen={showBookModal}
          onClose={() => { setShowBookModal(false); setSelectedMentor(null); }}
          mentor={selectedMentor}
          onSuccess={handleBookSuccess}
        />
      )}
    </div>
  );
}
