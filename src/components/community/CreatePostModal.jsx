import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronDown, Check, Hash, Folder, Paperclip, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { buildDefaultAvatarUrl } from '../../utils/avatar';
import communityApi from '../../api/communityApi';
import RichTextEditor from '../common/RichTextEditor';

const MAX_FILES = 2;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.gif', '.webp'];

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableHashtags, setAvailableHashtags] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);
  const { user: currentUser } = useAuth();

  const currentUserAvatar = currentUser?.avatar || buildDefaultAvatarUrl({
    id: currentUser?.id,
    email: currentUser?.email,
    fullName: currentUser?.name || 'User'
  });

  // Load categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setContent('');
      setSelectedCategories([]);
      setSelectedHashtags([]);
      setSelectedFiles([]);
      setFileError('');
    }
  }, [isOpen]);

  // Load hashtags when categories change
  useEffect(() => {
    if (selectedCategories.length > 0) {
      loadHashtagsByCategories(selectedCategories);
    } else {
      loadAllHashtags();
    }
  }, [selectedCategories]);

  const loadCategories = async () => {
    try {
      const res = await communityApi.getCategories();
      if (res?.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadAllHashtags = async () => {
    try {
      const res = await communityApi.getHashtags();
      if (res?.data?.data) {
        setAvailableHashtags(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load hashtags:', err);
    }
  };

  const loadHashtagsByCategories = async (categoryIds) => {
    try {
      // Load hashtags for each selected category and merge
      const allHashtags = [];
      const seenIds = new Set();

      for (const catId of categoryIds) {
        const res = await communityApi.getHashtagsByCategory(catId);
        if (res?.data?.data?.hashtags) {
          for (const h of res.data.data.hashtags) {
            if (!seenIds.has(h.id)) {
              seenIds.add(h.id);
              allHashtags.push(h);
            }
          }
        }
      }
      setAvailableHashtags(allHashtags);
    } catch (err) {
      console.error('Failed to load hashtags:', err);
      loadAllHashtags();
    }
  };

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catId));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const toggleHashtag = (hashtag) => {
    const isSelected = selectedHashtags.some(h => h.id === hashtag.id);
    if (isSelected) {
      setSelectedHashtags(selectedHashtags.filter(h => h.id !== hashtag.id));
    } else {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };

  const removeCategory = (catId) => {
    setSelectedCategories(selectedCategories.filter(c => c !== catId));
  };

  const removeHashtag = (hashtagId) => {
    setSelectedHashtags(selectedHashtags.filter(h => h.id !== hashtagId));
  };

  // === File Handling ===
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setFileError('');

    // Check total files
    if (selectedFiles.length + files.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      // Check size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name}: exceeds 10MB limit`);
        continue;
      }
      // Check extension
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(`${file.name}: invalid file type`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles([...selectedFiles, ...validFiles]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setFileError('');
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <ImageIcon size={18} className="text-blue-500" />;
    }
    return <FileText size={18} className="text-orange-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async () => {
    if (!content.trim() || content === '<p></p>') return;

    setSubmitting(true);
    try {
      let fileUrls = null;

      // Upload files first if any
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        try {
          const uploadRes = await communityApi.uploadPostFiles(selectedFiles);
          if (uploadRes?.data?.data?.fileUrls) {
            fileUrls = uploadRes.data.data.fileUrls;
          }
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          setFileError('Failed to upload files. Please try again.');
          setSubmitting(false);
          setUploadingFiles(false);
          return;
        }
        setUploadingFiles(false);
      }

      const payload = {
        content: content.trim(),
        hashtags: selectedHashtags.length > 0 ? selectedHashtags.map(h => h.name) : null,
        categoryId: selectedCategories.length > 0 ? selectedCategories[0] : null,
        fileUrls: fileUrls
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (catId) => {
    return categories.find(c => c.id === catId)?.name || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={currentUserAvatar}
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-700"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = buildDefaultAvatarUrl({ id: currentUser?.id, fullName: currentUser?.name });
              }}
            />
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Create Post</h2>
              <p className="text-sm text-neutral-500">{currentUser?.name || 'You'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Category Selector */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <Folder size={16} />
              Categories (max 5)
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-left flex items-center justify-between hover:border-primary-400 transition-colors"
            >
              <span className="text-neutral-600 dark:text-neutral-300">
                {selectedCategories.length > 0
                  ? `${selectedCategories.length} category selected`
                  : 'Select categories (optional)'
                }
              </span>
              <ChevronDown size={18} className={`text-neutral-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    disabled={!selectedCategories.includes(cat.id) && selectedCategories.length >= 5}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{cat.name}</span>
                    {selectedCategories.includes(cat.id) && (
                      <Check size={16} className="text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Categories Tags */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map(catId => (
                  <span
                    key={catId}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                  >
                    {getCategoryName(catId)}
                    <button onClick={() => removeCategory(catId)} className="hover:text-primary-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hashtag Selector */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <Hash size={16} />
              Hashtags
            </label>
            <button
              type="button"
              onClick={() => setShowHashtagDropdown(!showHashtagDropdown)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-left flex items-center justify-between hover:border-primary-400 transition-colors"
            >
              <span className="text-neutral-600 dark:text-neutral-300">
                {selectedHashtags.length > 0
                  ? `${selectedHashtags.length} hashtags selected`
                  : selectedCategories.length > 0
                    ? 'Select hashtags from selected categories'
                    : 'Select categories first or choose from all hashtags'
                }
              </span>
              <ChevronDown size={18} className={`text-neutral-400 transition-transform ${showHashtagDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showHashtagDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {availableHashtags.length === 0 ? (
                  <p className="px-4 py-3 text-neutral-500 text-sm">No hashtags available</p>
                ) : (
                  availableHashtags.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHashtag(h)}
                      className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white"
                    >
                      <span>#{h.name}</span>
                      {selectedHashtags.some(sh => sh.id === h.id) && (
                        <Check size={16} className="text-primary-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Hashtags Tags */}
            {selectedHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedHashtags.map(h => (
                  <span
                    key={h.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                  >
                    #{h.name}
                    <button onClick={() => removeHashtag(h.id)} className="hover:text-blue-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Content
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Share your thoughts, ask questions, or share your learning journey..."
            />
          </div>

          {/* File Upload Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <Paperclip size={16} />
              Attachments (max 2 files, 10MB each)
            </label>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.gif,.webp"
              className="hidden"
            />

            {/* Upload Button */}
            {selectedFiles.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-2"
              >
                <Paperclip size={18} />
                <span>Click to attach files</span>
              </button>
            )}

            {/* Error Message */}
            {fileError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                <span>{fileError}</span>
              </div>
            )}

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getFileIcon(file.name)}
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || content === '<p></p>' || submitting}
            className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg flex items-center gap-2
              ${content.trim() && content !== '<p></p>' && !submitting
                ? 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl shadow-primary-600/25 cursor-pointer hover:scale-105 active:scale-100'
                : 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed shadow-none'}`}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? (uploadingFiles ? 'Uploading...' : 'Posting...') : 'Post'}
          </button>
        </div>

      </div>

      {/* Click outside to close dropdowns */}
      {(showCategoryDropdown || showHashtagDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowCategoryDropdown(false);
            setShowHashtagDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default CreatePostModal;