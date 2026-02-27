import React from 'react';
import { Star, Clock, Users, ChevronRight, MessageCircle } from 'lucide-react';
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from '../../utils/avatar';

const MentorCard = ({ mentor }) => {
  const {
    id,
    name = "Unknown Mentor",
    title = "",
    avatarUrl,
    skills = [],
    rating = 0,
    reviews = 0,
    price = 0,
    isOnline = false,
    experience = "",
    totalSessions = 0
  } = mentor || {};

  // Normalize avatar URL or build default
  const avatar = normalizeAvatarUrl(avatarUrl) || buildDefaultAvatarUrl({ id, fullName: name });

  return (
    <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* --- Top Section: Avatar & Badge --- */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <img 
            src={avatar} 
            alt={name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-sm"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = buildDefaultAvatarUrl({ id, fullName: name });
            }}
          />
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
            <Star size={14} fill="currentColor" />
            <span className="text-sm">{rating}</span>
            <span className="text-xs text-neutral-400 font-normal">({reviews})</span>
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{totalSessions} sessions</span>
        </div>
      </div>

      {/* --- Info Section --- */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1 line-clamp-1">
          {title}
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Clock size={12} /> {experience} experience
        </div>
      </div>

      {/* --- Skills Section --- */}
      <div className="flex flex-wrap gap-2 mb-6">
        {skills.map((skill, index) => (
          <span 
            key={index} 
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {skill}
          </span>
        ))}
        {skills.length > 3 && (
          <span className="px-2 py-1 text-xs text-neutral-400">+2</span>
        )}
      </div>

      {/* --- Footer: Price & Action --- */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <span className="block text-xs text-neutral-400">Hourly Rate</span>
          <span className="text-lg font-bold text-neutral-900 dark:text-white">
            {price > 0 ? new Intl.NumberFormat('vi-VN').format(price) + ' VND' : 'Contact'}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <MessageCircle size={20} />
          </button>
          <button className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/30">
            Hire now <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
