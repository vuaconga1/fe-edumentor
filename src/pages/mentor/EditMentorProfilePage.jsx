// src/pages/mentor/EditMentorProfilePage.jsx
import { HiArrowLeft } from "react-icons/hi";
import { Save } from "lucide-react";
import { useEditMentorProfile } from "../../hooks/useEditMentorProfile";
import AvatarUpload from "../../components/mentor/AvatarUpload";
import CategoryHashtagSelector from "../../components/mentor/CategoryHashtagSelector";

const EditMentorProfilePage = () => {
  const {
    fileInputRef, categoryDropdownRef, hashtagDropdownRef,
    avatarPreview, avatarSeed, isUploadingAvatar, onPickAvatar, openFilePicker,
    loading, isSaving, error,
    form, handleChange,
    countries, cities, loadingLocations,
    allCategories, allHashtags, loadingCatHash,
    selectedCategoryIds, selectedHashtagIds, toggleCategory, toggleHashtag,
    categoryDropdownOpen, setCategoryDropdownOpen,
    hashtagDropdownOpen, setHashtagDropdownOpen,
    handleSubmit, navigate,
  } = useEditMentorProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/mentor/profile")}
            className="p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
            Edit Mentor Profile
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {String(error)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="xl:col-span-1 space-y-6">
              <AvatarUpload
                avatarPreview={avatarPreview}
                avatarSeed={avatarSeed}
                isUploadingAvatar={isUploadingAvatar}
                fileInputRef={fileInputRef}
                onPickAvatar={onPickAvatar}
                onOpenFilePicker={openFilePicker}
                fullName={form.fullName}
              />

              {/* Pricing Section */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Pricing</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Hourly Rate (VND)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={form.hourlyRate}
                      onChange={handleChange}
                      min={0}
                      placeholder="100000"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Package Price (VND)
                    </label>
                    <input
                      type="number"
                      name="packagePrice"
                      value={form.packagePrice}
                      onChange={handleChange}
                      min={0}
                      placeholder="500000"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="xl:col-span-2 space-y-6">
              {/* General Information */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">General Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Your phone"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">School</label>
                    <input
                      type="text"
                      name="school"
                      value={form.school}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Country</label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      disabled={loadingLocations}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      City / Province
                    </label>
                    {cities.length > 0 ? (
                      <select
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">Select City</option>
                        {cities.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Enter city name"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mentor Profile */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Mentor Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Title / Position</label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Senior Developer, Tech Lead"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Experience (years)</label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={form.experienceYears}
                      onChange={handleChange}
                      min={0}
                      placeholder="5"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Introduction</label>
                  <textarea
                    name="introduction"
                    value={form.introduction}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe your expertise and what you can help students with..."
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Availability Note</label>
                  <input
                    type="text"
                    name="availabilityNote"
                    value={form.availabilityNote}
                    onChange={handleChange}
                    placeholder="e.g. Available weekday evenings, 6PM - 10PM"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Categories & Skills */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Categories & Skills</h2>
                <CategoryHashtagSelector
                  allCategories={allCategories}
                  allHashtags={allHashtags}
                  selectedCategoryIds={selectedCategoryIds}
                  selectedHashtagIds={selectedHashtagIds}
                  toggleCategory={toggleCategory}
                  toggleHashtag={toggleHashtag}
                  loadingCatHash={loadingCatHash}
                  categoryDropdownOpen={categoryDropdownOpen}
                  setCategoryDropdownOpen={setCategoryDropdownOpen}
                  hashtagDropdownOpen={hashtagDropdownOpen}
                  setHashtagDropdownOpen={setHashtagDropdownOpen}
                  categoryDropdownRef={categoryDropdownRef}
                  hashtagDropdownRef={hashtagDropdownRef}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/mentor/profile")}
                  className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition font-medium shadow"
                >
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMentorProfilePage;
