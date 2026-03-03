// src/components/mentor/MentorCard.jsx
import { HiStar, HiClock, HiLocationMarker, HiChevronRight } from "react-icons/hi";
import { buildDefaultAvatarUrl } from "../../utils/avatar";

export default function MentorCard({ mentor, onBook, formatPrice }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="relative">
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-white dark:border-neutral-800 shadow-sm group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = buildDefaultAvatarUrl({ id: mentor.id, fullName: mentor.name });
            }}
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-neutral-900 ${
              mentor.isOnline ? "bg-green-500" : "bg-neutral-400"
            }`}
          />
        </div>
        {mentor.reviews > 0 && mentor.rating > 0 ? (
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

      <div className="mb-3 sm:mb-4">
        <h3
          onClick={() => window.open(`/student/mentor/${mentor.id}`, "_blank")}
          className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors cursor-pointer hover:underline line-clamp-1"
        >
          {mentor.name}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">{mentor.title}</p>
        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-neutral-400">
          <span className="flex items-center gap-0.5 sm:gap-1">
            <HiClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {mentor.experience}
          </span>
          {mentor.reviews > 0 && mentor.rating > 0 && <span>{mentor.reviews} reviews</span>}
        </div>
        {mentor.city && (
          <div className="flex items-center gap-0.5 sm:gap-1 mt-1 text-[10px] sm:text-xs text-neutral-400">
            <HiLocationMarker className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {mentor.city}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-5">
        {(mentor.skills || []).slice(0, 3).map((skill, i) => (
          <span key={i} className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div>
          <span className="text-[10px] sm:text-xs text-neutral-400">From</span>
          <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            {formatPrice(mentor.price)}
            <span className="text-xs sm:text-sm font-normal text-neutral-400"> VND/hr</span>
          </div>
        </div>
        <button
          onClick={() => onBook(mentor)}
          className="flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 hover:scale-105"
        >
          Book
          <HiChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
