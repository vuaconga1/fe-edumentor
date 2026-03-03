// src/components/mentor/AvatarUpload.jsx
import { Loader2 } from "lucide-react";
import { HiCamera } from "react-icons/hi";
import { buildDefaultAvatarUrl } from "../../utils/avatar";

export default function AvatarUpload({
  avatarPreview,
  avatarSeed,
  isUploadingAvatar,
  fileInputRef,
  onPickAvatar,
  onOpenFilePicker,
  fullName,
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Profile Photo</h2>
      <div className="flex flex-col items-center">
        <div className="relative">
          <img
            src={avatarPreview}
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = buildDefaultAvatarUrl(avatarSeed);
            }}
          />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
          <button
            type="button"
            onClick={onOpenFilePicker}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60"
            title="Change avatar"
          >
            <HiCamera className="w-4 h-4" />
          </button>
        </div>
        <h3 className="font-medium text-neutral-900 dark:text-white mt-3">{fullName}</h3>
        {isUploadingAvatar && (
          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading...
          </div>
        )}
      </div>
    </div>
  );
}
