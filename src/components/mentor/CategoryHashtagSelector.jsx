// src/components/mentor/CategoryHashtagSelector.jsx
import { useRef } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
import { HiTag, HiChevronDown } from "react-icons/hi";

export default function CategoryHashtagSelector({
  allCategories,
  allHashtags,
  selectedCategoryIds,
  selectedHashtagIds,
  toggleCategory,
  toggleHashtag,
  loadingCatHash,
  categoryDropdownOpen,
  setCategoryDropdownOpen,
  hashtagDropdownOpen,
  setHashtagDropdownOpen,
  categoryDropdownRef,
  hashtagDropdownRef,
}) {
  if (loadingCatHash) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-neutral-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Categories Dropdown */}
      <div ref={categoryDropdownRef}>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-blue-600" />
          Categories <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          Select categories that represent your expertise
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen((v) => !v)}
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500"
          >
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {selectedCategoryIds.length === 0 ? "Select categories..." : `${selectedCategoryIds.length} selected`}
            </span>
            <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {categoryDropdownOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {allCategories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                  style={{ paddingLeft: cat.parentId ? "2.5rem" : "1rem" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`ml-3 text-sm text-neutral-700 dark:text-neutral-300 ${!cat.parentId ? "font-semibold" : ""}`}>
                    {cat.parentId ? "└─ " : ""}{cat.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedCategoryIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCategoryIds.map((catId) => {
              const cat = allCategories.find((c) => c.id === catId);
              return cat ? (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"
                >
                  {cat.name}
                  <button type="button" onClick={() => toggleCategory(catId)} className="hover:text-blue-900 dark:hover:text-blue-200">
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Hashtags Dropdown */}
      <div ref={hashtagDropdownRef}>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
          <HiTag className="w-4 h-4 text-blue-600" />
          Skills (Hashtags)
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          Select specific skills or topics (optional)
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setHashtagDropdownOpen((v) => !v)}
            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500"
          >
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {selectedHashtagIds.length === 0 ? "Select skills..." : `${selectedHashtagIds.length} selected`}
            </span>
            <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${hashtagDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {hashtagDropdownOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {allHashtags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedHashtagIds.includes(tag.id)}
                    onChange={() => toggleHashtag(tag.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">#{tag.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedHashtagIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedHashtagIds.map((tagId) => {
              const tag = allHashtags.find((h) => h.id === tagId);
              return tag ? (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"
                >
                  #{tag.name}
                  <button type="button" onClick={() => toggleHashtag(tagId)} className="hover:text-blue-900 dark:hover:text-blue-200">
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
