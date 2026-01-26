import React from 'react';
import { Edit2, Mail, Phone, Users, BookOpen, Star, UserCheck, MapPin } from 'lucide-react';

const ProfileHeader = ({ profile, isOwner = true, onEditClick, onFollowersClick, rank = 'gold' }) => {
  const { name, title, avatar, email, stats, role, location } = profile;

  const formatFollowers = (count) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // Rank colors: Bronze, Silver, Gold
  const rankStyles = {
    bronze: {
      gradient: 'from-amber-600 via-orange-500 to-amber-700',
      label: 'Bronze',
      labelBg: 'bg-amber-600',
    },
    silver: {
      gradient: 'from-gray-300 via-gray-100 to-gray-400',
      label: 'Silver',
      labelBg: 'bg-gray-400',
    },
    gold: {
      gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
      label: 'Gold',
      labelBg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    },
  };

  const currentRank = rankStyles[rank] || rankStyles.bronze;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        
        {/* Avatar Section */}
        <div className="relative group">
          <div className={`absolute -inset-1 bg-gradient-to-r ${currentRank.gradient} rounded-full opacity-90 blur-sm transition duration-200 group-hover:opacity-100 group-hover:blur`}></div>
          <div className={`absolute -inset-0.5 bg-gradient-to-r ${currentRank.gradient} rounded-full`}></div>
          <img
            src={avatar}
            alt={name}
            className="relative w-36 h-36 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow-xl"
          />
          {/* Rank Badge */}
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 ${currentRank.labelBg} text-white text-xs font-bold rounded-full shadow-lg`}>
            {currentRank.label}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                {name}
              </h1>
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-3">
                {title}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                {location && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full">
                    <MapPin size={14} />
                    <span>{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full">
                  <Mail size={14} />
                  <span>{email}</span>
                </div>
              </div>
            </div>

            {/* Edit Button - Đã đổi sang màu Xanh */}
            {isOwner && (
              <button
                onClick={onEditClick}
                className="self-center md:self-start px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {role === 'mentor' && stats.students !== undefined && (
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center min-h-[90px]">
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1">
                  <UserCheck size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
                </div>
                <div className="text-xl font-bold text-neutral-900 dark:text-white">{stats.students}</div>
              </div>
            )}

            <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center min-h-[90px]">
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1">
                <BookOpen size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Sessions</span>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">{stats.sessions}</div>
            </div>

            <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center min-h-[90px]">
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">Rating</span>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">{stats.rating}</div>
            </div>

            <button 
              onClick={onFollowersClick}
              className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border-2 border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center min-h-[90px] cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-105 transition-transform">
                <Users size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Followers</span>
              </div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {formatFollowers(stats.followers)}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
